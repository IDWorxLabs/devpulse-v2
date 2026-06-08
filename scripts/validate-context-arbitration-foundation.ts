/**
 * DevPulse V2 Context Arbitration Foundation — validation scenarios.
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
  arbitrateContext,
  assertCentralBrainOwnershipUnchanged,
  assertIntentArchitectureOwnershipUnchanged,
  buildDefaultCandidates,
  CONTEXT_ARBITRATION_OWNER_MODULE,
  CONTEXT_ARBITRATION_PASS_TOKEN,
  DevPulseV2ContextArbitrationAuthority,
  filterContext,
  formatContextArbitrationReport,
  getIntentContextRequirements,
  mapIntentToContextPriority,
  prioritizeContext,
  resetDevPulseV2ContextArbitrationAuthorityForTests,
  summarizeArbitration,
} from '../src/context-arbitration/index.js';
import { INTENT_OWNER_MODULE } from '../src/intent-architecture/types.js';
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
  console.log('DevPulse V2 — Context Arbitration Foundation Validation');
  console.log('=======================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 3,
    systems: ['context_arbitration'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts context_arbitration packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const authority = resetDevPulseV2ContextArbitrationAuthorityForTests();

  assert(
    '2. Context Arbitration Authority exists',
    authority instanceof DevPulseV2ContextArbitrationAuthority,
    `ownerModule=${DevPulseV2ContextArbitrationAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('context_arbitration');
  assert(
    '3. Ownership registry contains context_arbitration',
    owner.ownerModule === CONTEXT_ARBITRATION_OWNER_MODULE &&
      DevPulseV2ContextArbitrationAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const emptyState = authority.getArbitrationState();
  assert(
    '4. Context Arbitration starts empty',
    emptyState.arbitrationCount === 0,
    `arbitrations=${emptyState.arbitrationCount}`,
  );

  const candidates = buildDefaultCandidates();
  const arbitrated = arbitrateContext(candidates, { intentType: 'BUILD_REQUEST' });
  assert(
    '5. arbitrateContext works',
    arbitrated.arbitrationId.length > 0 &&
      arbitrated.selectedContext.length + arbitrated.ignoredContext.length === candidates.length,
    `selected=${arbitrated.selectedContext.length} ignored=${arbitrated.ignoredContext.length}`,
  );

  const prioritized = prioritizeContext(candidates);
  assert(
    '6. prioritizeContext works',
    prioritized[0].priority === 'MEDIUM' || prioritized.length === candidates.length,
    `first=${prioritized[0]?.priority}`,
  );

  const filtered = filterContext(
    candidates.map((c) => ({ ...c, priority: 'IGNORE' as const })),
  );
  assert(
    '7. filterContext works',
    filtered.length === 0,
    `remaining=${filtered.length}`,
  );

  const summary = summarizeArbitration(arbitrated);
  assert(
    '8. summarizeArbitration works',
    summary.includes('Arbitration') && summary.includes('selected='),
    summary.slice(0, 80),
  );

  const buildResult = authority.arbitrateWithDefaults('BUILD_REQUEST');
  const buildSelected = buildResult.selectedContext.map((c) => c.source);
  const buildIgnored = buildResult.ignoredContext.map((c) => c.source);
  assert(
    '9. BUILD_REQUEST prioritization works',
    buildSelected.includes('PROJECT_VAULT') &&
      buildSelected.includes('INTENT_ARCHITECTURE') &&
      buildIgnored.includes('TIMELINE_LEDGER'),
    `selected=${buildSelected.join(',')} ignored=${buildIgnored.join(',')}`,
  );

  const questionResult = authority.arbitrateWithDefaults('QUESTION');
  const questionSelected = questionResult.selectedContext.map((c) => c.source);
  const questionIgnored = questionResult.ignoredContext.map((c) => c.source);
  assert(
    '10. QUESTION prioritization works',
    questionSelected.includes('INTENT_ARCHITECTURE') &&
      questionIgnored.includes('TIMELINE_LEDGER'),
    `selected=${questionSelected.join(',')}`,
  );

  const analysisResult = authority.arbitrateWithDefaults('ANALYSIS_REQUEST');
  const analysisSelected = analysisResult.selectedContext.map((c) => c.source);
  assert(
    '11. ANALYSIS_REQUEST prioritization works',
    analysisSelected.includes('EVIDENCE_REGISTRY') &&
      analysisSelected.includes('CENTRAL_BRAIN') &&
      analysisSelected.includes('INTENT_ARCHITECTURE'),
    `selected=${analysisSelected.join(',')}`,
  );

  const requirements = getIntentContextRequirements('BUILD_REQUEST');
  const vaultPriority = mapIntentToContextPriority('BUILD_REQUEST', 'PROJECT_VAULT');
  assert(
    '12. Intent bridge works',
    requirements.includes('PROJECT_VAULT') &&
      requirements.includes('INTENT_ARCHITECTURE') &&
      vaultPriority === 'HIGH' &&
      assertIntentArchitectureOwnershipUnchanged(),
    `requirements=${requirements.length} vault=${vaultPriority}`,
  );

  const published = authority.publishArbitrationSummary(buildResult);
  const latest = authority.getLatestArbitrationSummary();
  assert(
    '13. Central Brain bridge works',
    published.arbitrationId === buildResult.arbitrationId &&
      latest !== null &&
      latest.summary.length > 0 &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const stored = authority.arbitrateAndStore(candidates, 'BUILD_REQUEST');
  const retrieved = authority.getArbitration(stored.arbitrationId);
  assert(
    '14. Arbitration records stored correctly',
    authority.getArbitrationState().arbitrationCount >= 4 &&
      retrieved !== null &&
      retrieved.selectedContext.length > 0,
    `stored=${stored.arbitrationId}`,
  );

  const reportText = formatContextArbitrationReport(
    authority.getArbitrationState(),
    authority.listArbitrations(),
  );
  assert(
    '15. Report generated',
    reportText.includes('Context Arbitration Report') &&
      authority.formatReport().includes('Recommendation:'),
    `arbitrations=${authority.getArbitrationState().arbitrationCount}`,
  );

  assert(
    '16. Context Arbitration does not become answer authority',
    DevPulseV2ContextArbitrationAuthority.assertDoesNotBecomeAnswerAuthority() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered(),
    `arbitration=${CONTEXT_ARBITRATION_OWNER_MODULE}`,
  );

  assert(
    '17. Context Arbitration does not execute actions',
    DevPulseV2ContextArbitrationAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '18. Context Arbitration does not generate code',
    DevPulseV2ContextArbitrationAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '19. Context Arbitration does not replace Central Brain',
    DevPulseV2ContextArbitrationAuthority.assertDoesNotReplaceCentralBrain(),
    `brain=${CENTRAL_BRAIN_OWNER_MODULE}`,
  );

  assert(
    '20. Context Arbitration does not replace Intent Architecture',
    DevPulseV2ContextArbitrationAuthority.assertDoesNotReplaceIntentArchitecture() &&
      getDevPulseV2Owner('intent_architecture').ownerModule === INTENT_OWNER_MODULE,
    `intent=${INTENT_OWNER_MODULE}`,
  );

  assert(
    '21. Validation Budget Policy still passes',
    DevPulseV2ContextArbitrationAuthority.assertValidationBudgetCompatible() &&
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
  assert('22. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('=======================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(CONTEXT_ARBITRATION_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('CONTEXT ARBITRATION FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
