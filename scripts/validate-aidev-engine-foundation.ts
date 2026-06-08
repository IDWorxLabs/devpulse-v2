/**
 * DevPulse V2 AiDev Engine Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { PROTECTION_OWNER_MODULE } from '../src/answer-authority-protection/types.js';
import { DevPulseV2AnswerAuthorityProtectionAuthority } from '../src/answer-authority-protection/index.js';
import {
  assertCentralBrainOwnershipUnchanged,
  assertIntentArchitectureOwnershipUnchanged,
  assertTimelineLedgerOwnershipUnchanged,
  AIDEV_OWNER_MODULE,
  AIDEV_PASS_TOKEN,
  createBuildRequest,
  DevPulseV2AiDevEngineAuthority,
  formatAiDevEngineReport,
  getLastAiDevTimelineEventIds,
  normalizeBuildRequest,
  resetDevPulseV2AiDevEngineAuthorityForTests,
  summarizeBuildRequest,
  updateRequestStatus,
} from '../src/aidev-engine/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { INTENT_OWNER_MODULE } from '../src/intent-architecture/types.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/index.js';
import { LEDGER_OWNER_MODULE } from '../src/timeline-ledger/types.js';
import { DevPulseV2VisibleUiGuardAuthority, GUARD_OWNER_MODULE } from '../src/visible-ui-guard/index.js';
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
  console.log('DevPulse V2 — AiDev Engine Foundation Validation');
  console.log('=================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 4,
    systems: ['aidev_engine'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts aidev_engine packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const engine = resetDevPulseV2AiDevEngineAuthorityForTests();

  assert(
    '2. AiDev Engine Authority exists',
    engine instanceof DevPulseV2AiDevEngineAuthority,
    `ownerModule=${DevPulseV2AiDevEngineAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('aidev_engine');
  assert(
    '3. Ownership registry contains aidev_engine',
    owner.ownerModule === AIDEV_OWNER_MODULE &&
      DevPulseV2AiDevEngineAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Engine starts empty',
    engine.getEngineState().requestCount === 0,
    `requests=${engine.getEngineState().requestCount}`,
  );

  const created = createBuildRequest('Build me a mobile app for DevPulse');
  assert(
    '5. createBuildRequest works',
    created.requestId.length > 0 && created.status === 'RECEIVED',
    created.requestId,
  );

  const normalized = normalizeBuildRequest('  Build   me   an   app  ');
  assert(
    '6. normalizeBuildRequest works',
    normalized === 'Build me an app',
    normalized,
  );

  const summary = summarizeBuildRequest(created);
  assert(
    '7. summarizeBuildRequest works',
    summary.includes(created.requestId) && summary.includes('RECEIVED'),
    summary.slice(0, 80),
  );

  const updated = updateRequestStatus(created, 'READY_FOR_PLANNING');
  assert(
    '8. updateRequestStatus works',
    updated.status === 'READY_FOR_PLANNING',
    updated.status,
  );

  const intake = engine.intakeBuildRequest('Build a task manager web app');
  const withIntent = engine.attachIntent(intake.requestId);
  const intentSummary = engine.getIntentSummaryForRequest(intake.requestId);
  assert(
    '9. Intent bridge works',
    withIntent !== null &&
      withIntent.intentId !== undefined &&
      withIntent.status === 'ANALYZING' &&
      intentSummary !== null &&
      assertIntentArchitectureOwnershipUnchanged() &&
      getDevPulseV2Owner('intent_architecture').ownerModule === INTENT_OWNER_MODULE,
    intentSummary?.intentSummary.slice(0, 60) ?? 'missing',
  );

  const published = engine.publishAiDevSummary(withIntent!);
  const latest = engine.getLatestAiDevSummary();
  assert(
    '10. Central Brain bridge works',
    published.requestId === withIntent!.requestId &&
      latest !== null &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const timelineIds = getLastAiDevTimelineEventIds();
  assert(
    '11. Timeline bridge works',
    timelineIds.created !== undefined &&
      timelineIds.status !== undefined &&
      assertTimelineLedgerOwnershipUnchanged() &&
      getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE,
    `created=${timelineIds.created}`,
  );

  const ready = engine.setRequestStatus(intake.requestId, 'READY_FOR_PLANNING');
  const retrieved = engine.getRequest(intake.requestId);
  assert(
    '12. Request records stored correctly',
    engine.getEngineState().requestCount === 1 &&
      retrieved !== null &&
      ready?.status === 'READY_FOR_PLANNING',
    retrieved?.status ?? 'missing',
  );

  const reportText = formatAiDevEngineReport(engine.getEngineState(), engine.listRequests());
  assert(
    '13. Report generated',
    reportText.includes('AiDev Engine Report') && engine.formatReport().includes('Recommendation:'),
    `requests=${engine.getEngineState().requestCount}`,
  );

  assert(
    '14. AiDev does not generate code',
    DevPulseV2AiDevEngineAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '15. AiDev does not execute actions',
    DevPulseV2AiDevEngineAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '16. AiDev does not modify projects',
    DevPulseV2AiDevEngineAuthority.assertDoesNotModifyProjects() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '17. AiDev does not become answer authority',
    DevPulseV2AiDevEngineAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    AIDEV_OWNER_MODULE,
  );

  assert(
    '18. Answer Authority Protection still passes',
    DevPulseV2AiDevEngineAuthority.assertAnswerAuthorityProtectionCompatible() &&
      DevPulseV2AnswerAuthorityProtectionAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('answer_authority_protection_policy').ownerModule === PROTECTION_OWNER_MODULE,
    `protection=${PROTECTION_OWNER_MODULE}`,
  );

  assert(
    '19. Visible UI Guard remains compatible',
    DevPulseV2AiDevEngineAuthority.assertVisibleUiGuardCompatible() &&
      DevPulseV2VisibleUiGuardAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('visible_ui_clickability_guard').ownerModule === GUARD_OWNER_MODULE,
    `guard=${GUARD_OWNER_MODULE}`,
  );

  assert(
    '20. Validation Budget Policy still passes',
    DevPulseV2AiDevEngineAuthority.assertValidationBudgetCompatible() &&
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
  assert('21. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(AIDEV_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('AIDEV ENGINE FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
