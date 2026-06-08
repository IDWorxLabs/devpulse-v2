/**
 * DevPulse V2 Trust Engine Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import { HARNESS_OWNER_MODULE } from '../src/browser-verification/types.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import {
  DevPulseV2TrustEngineAuthority,
  formatTrustEngineReport,
  resetDevPulseV2TrustEngineAuthorityForTests,
  TRUST_CHECK_COUNT,
  TRUST_OWNER_MODULE,
  TRUST_PASS_TOKEN,
} from '../src/trust-engine/index.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import {
  resetDevPulseV2Phase1StabilitySoakAuthorityForTests,
} from '../src/stability-soak/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Trust Engine Foundation Validation');
  console.log('=================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 2,
    systems: ['trust_engine'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts Phase 2 trust_engine packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  await resetDevPulseV2Phase1StabilitySoakAuthorityForTests().runSoak(3);

  const trustEngine = resetDevPulseV2TrustEngineAuthorityForTests();
  assert(
    '2. Trust Engine Authority exists',
    trustEngine instanceof DevPulseV2TrustEngineAuthority,
    `ownerModule=${DevPulseV2TrustEngineAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('trust_engine');
  assert(
    '3. Ownership registry contains trust_engine',
    owner.ownerModule === TRUST_OWNER_MODULE &&
      DevPulseV2TrustEngineAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const result = await trustEngine.evaluateTrust();
  const reportText = formatTrustEngineReport(result);

  assert(
    '4. Trust Engine collects browser verification evidence',
    result.evidence.some((e) => e.source === 'BROWSER_VERIFICATION'),
    result.evidence.find((e) => e.source === 'BROWSER_VERIFICATION')?.summary ?? 'missing',
  );

  assert(
    '5. Trust Engine collects chat authority evidence',
    result.evidence.some((e) => e.source === 'CHAT_AUTHORITY'),
    result.evidence.find((e) => e.source === 'CHAT_AUTHORITY')?.summary ?? 'missing',
  );

  assert(
    '6. Trust Engine collects inline feed evidence',
    result.evidence.some((e) => e.source === 'INLINE_OPERATOR_FEED'),
    result.evidence.find((e) => e.source === 'INLINE_OPERATOR_FEED')?.summary ?? 'missing',
  );

  assert(
    '7. Trust Engine collects shell evidence',
    result.evidence.some((e) => e.source === 'SHELL_AUTHORITY'),
    result.evidence.find((e) => e.source === 'SHELL_AUTHORITY')?.summary ?? 'missing',
  );

  assert(
    '8. Trust Engine creates trust checks',
    result.checks.length === TRUST_CHECK_COUNT &&
      result.checks.every((c) => c.checkId.startsWith('TE-')),
    `checks=${result.checks.length}`,
  );

  assert(
    '9. Trust score is calculated',
    result.trustScore >= 0 &&
      result.trustScore <= 100 &&
      result.trustScore ===
        Math.round(
          (result.checks.reduce((sum, c) => {
            if (c.status === 'PASS') return sum + 10;
            if (c.status === 'WARN') return sum + 5;
            return sum;
          }, 0) /
            (result.checks.length * 10)) *
            100,
        ),
    `score=${result.trustScore}`,
  );

  assert(
    '10. Confidence is calculated',
    result.confidence === 'LOW' ||
      result.confidence === 'MEDIUM' ||
      result.confidence === 'HIGH',
    `confidence=${result.confidence}`,
  );

  assert(
    '11. Trust report is generated',
    reportText.includes('Trust Engine Report') &&
      reportText.includes('Trust score:') &&
      reportText.includes('Recommendation:'),
    `status=${result.status}`,
  );

  const answerOwners = listDevPulseV2Owners().filter(
    (o) => o.domain === 'chat_authority' || o.domain === 'chat_answer_authority',
  );
  assert(
    '12. Trust Engine does not become answer authority',
    assertSingleAnswerAuthorityRegistered() &&
      !answerOwners.some((o) => o.ownerModule === TRUST_OWNER_MODULE) &&
      answerOwners.every((o) => o.ownerModule === CHAT_OWNER_MODULE),
    `trust=${TRUST_OWNER_MODULE} chat=${CHAT_OWNER_MODULE}`,
  );

  assert(
    '13. Trust Engine does not replace browser harness',
    DevPulseV2TrustEngineAuthority.assertDoesNotOwnBrowserHarness() &&
      getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    `harness=${HARNESS_OWNER_MODULE}`,
  );

  assert(
    '14. Project Vault ownership unchanged (local boundary check)',
    getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '15. Browser harness ownership unchanged (local boundary check)',
    getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    `harness=${HARNESS_OWNER_MODULE}`,
  );

  assert(
    '16. Chat Authority ownership unchanged (local boundary check)',
    getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE,
    `chat=${CHAT_OWNER_MODULE}`,
  );

  assert(
    '17. Foundation Enforcement ownership present (local boundary check)',
    getDevPulseV2Owner('law_enforcement').ownerModule === 'devpulse_v2_foundation_enforcement',
    'law_enforcement registered',
  );

  assert(
    '18. No duplicate answer authority exists',
    assertSingleAnswerAuthorityRegistered() &&
      new Set(answerOwners.map((o) => o.ownerModule)).size === 1,
    `owners=${answerOwners.map((o) => o.ownerModule).join(',')}`,
  );

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('=================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(TRUST_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('TRUST ENGINE FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
