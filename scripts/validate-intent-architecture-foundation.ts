/**
 * DevPulse V2 Intent Architecture Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import {
  assertCentralBrainOwnershipUnchanged,
  classifyIntent,
  DevPulseV2IntentArchitectureAuthority,
  extractIntent,
  formatIntentArchitectureReport,
  INTENT_OWNER_MODULE,
  INTENT_PASS_TOKEN,
  normalizeIntent,
  resetDevPulseV2IntentArchitectureAuthorityForTests,
  summarizeIntent,
} from '../src/intent-architecture/index.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';

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
  console.log('DevPulse V2 — Intent Architecture Foundation Validation');
  console.log('========================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 3,
    systems: ['intent_architecture'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts intent_architecture packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const authority = resetDevPulseV2IntentArchitectureAuthorityForTests();

  assert(
    '2. Intent Architecture Authority exists',
    authority instanceof DevPulseV2IntentArchitectureAuthority,
    `ownerModule=${DevPulseV2IntentArchitectureAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('intent_architecture');
  assert(
    '3. Ownership registry contains intent_architecture',
    owner.ownerModule === INTENT_OWNER_MODULE &&
      DevPulseV2IntentArchitectureAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const emptyState = authority.getArchitectureState();
  assert(
    '4. Intent Architecture starts empty',
    emptyState.intentCount === 0,
    `intents=${emptyState.intentCount}`,
  );

  const extracted = extractIntent('What is DevPulse?');
  assert(
    '5. extractIntent works',
    extracted.intentId.length > 0 && extracted.normalizedInput.length > 0,
    extracted.intentId,
  );

  const classified = classifyIntent('Build me a mobile app');
  assert(
    '6. classifyIntent works',
    classified.intentType === 'BUILD_REQUEST',
    classified.intentType,
  );

  const normalized = normalizeIntent('  Analyze   this   architecture  ');
  assert(
    '7. normalizeIntent works',
    normalized === 'Analyze this architecture',
    normalized,
  );

  const summary = summarizeIntent(extracted);
  assert(
    '8. summarizeIntent works',
    summary.includes('QUESTION') && summary.includes('What is DevPulse?'),
    summary.slice(0, 80),
  );

  const question = classifyIntent('What is DevPulse?');
  assert(
    '9. QUESTION classification works',
    question.intentType === 'QUESTION' && question.confidence === 'HIGH',
    question.intentType,
  );

  const buildReq = classifyIntent('Build me a mobile app');
  assert(
    '10. BUILD_REQUEST classification works',
    buildReq.intentType === 'BUILD_REQUEST',
    buildReq.intentType,
  );

  const analysisReq = classifyIntent('Analyze this architecture');
  assert(
    '11. ANALYSIS_REQUEST classification works',
    analysisReq.intentType === 'ANALYSIS_REQUEST',
    analysisReq.intentType,
  );

  const stored = authority.extractAndStoreIntent('Build me a mobile app');
  const retrieved = authority.getIntent(stored.intentId);
  assert(
    '12. Intent records stored correctly',
    authority.getArchitectureState().intentCount === 1 &&
      retrieved !== null &&
      retrieved.intentType === 'BUILD_REQUEST',
    `stored=${stored.intentId}`,
  );

  const published = authority.publishIntentSummary(stored);
  const latest = authority.getLatestIntentSummary();
  assert(
    '13. Central Brain bridge works',
    published.intentId === stored.intentId &&
      latest !== null &&
      latest.summary.length > 0 &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const reportText = formatIntentArchitectureReport(
    authority.getArchitectureState(),
    authority.listIntents(),
  );
  assert(
    '14. Report generated',
    reportText.includes('Intent Architecture Report') &&
      authority.formatReport().includes('Recommendation:'),
    `intents=${authority.getArchitectureState().intentCount}`,
  );

  assert(
    '15. Intent Architecture does not become answer authority',
    DevPulseV2IntentArchitectureAuthority.assertDoesNotBecomeAnswerAuthority() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered(),
    `intent=${INTENT_OWNER_MODULE}`,
  );

  assert(
    '16. Intent Architecture does not execute actions',
    DevPulseV2IntentArchitectureAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '17. Intent Architecture does not generate code',
    DevPulseV2IntentArchitectureAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '18. Intent Architecture does not replace Central Brain',
    DevPulseV2IntentArchitectureAuthority.assertDoesNotReplaceCentralBrain(),
    `brain=${CENTRAL_BRAIN_OWNER_MODULE}`,
  );

  assert(
    '19. Validation Budget Policy still passes',
    DevPulseV2IntentArchitectureAuthority.assertValidationBudgetCompatible() &&
      DevPulseV2ValidationBudgetPolicyAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE,
    `policy=${POLICY_OWNER_MODULE}`,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('20. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('========================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(INTENT_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('INTENT ARCHITECTURE FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
