/**
 * DevPulse V2 Observability Stack Reality Validation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import { REGISTRY_OWNER_MODULE } from '../src/evidence-registry/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  DevPulseV2ObservabilityStackValidationAuthority,
  formatObservabilityStackValidationReport,
  resetDevPulseV2ObservabilityStackValidationAuthorityForTests,
  runObservabilityStackValidation,
  VALIDATION_OWNER_MODULE,
  VALIDATION_PASS_TOKEN,
  validateDuplicateDetection,
  validateEvidencePropagation,
  validateObservabilityPipeline,
  validateOwnershipIntegrity,
  validateTimelinePropagation,
  validateBrainVisibility,
  PHASE_6_READY,
} from '../src/observability-stack-validation/index.js';
import { getDevPulseV2FailurePredictionAuthority } from '../src/failure-prediction/index.js';
import { getDevPulseV2RealityReplayAuthority } from '../src/reality-replay/index.js';
import { getDevPulseV2RootCauseAttributionAuthority } from '../src/root-cause-attribution/index.js';
import { getDevPulseV2SelfVisionAuthority } from '../src/self-vision/index.js';
import { getDevPulseV2SessionReplayAuthority } from '../src/session-replay/index.js';
import { HARNESS_OWNER_MODULE } from '../src/browser-verification/types.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import { LEDGER_OWNER_MODULE } from '../src/timeline-ledger/types.js';
import { TRUST_OWNER_MODULE } from '../src/trust-engine/types.js';
import { GUARD_OWNER_MODULE } from '../src/visible-ui-guard/types.js';
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

function getHandoff(result: ReturnType<typeof runObservabilityStackValidation>, id: string) {
  return result.handoffs.find((h) => h.handoffId === id);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Observability Stack Reality Validation');
  console.log('====================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 5.5,
    systems: ['observability_stack_reality_validation'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'validation',
  });

  assert(
    '1. Build gate accepts observability_stack_reality_validation packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const validator = resetDevPulseV2ObservabilityStackValidationAuthorityForTests();

  assert(
    '2. Validation Authority exists',
    validator instanceof DevPulseV2ObservabilityStackValidationAuthority,
    `ownerModule=${DevPulseV2ObservabilityStackValidationAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('observability_stack_reality_validation');
  assert(
    '3. Ownership registry contains observability_stack_reality_validation',
    owner.ownerModule === VALIDATION_OWNER_MODULE &&
      DevPulseV2ObservabilityStackValidationAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const result = validator.runValidation();

  const selfVisionSessions = getDevPulseV2SelfVisionAuthority().getObservationSessions();
  const observationCount = selfVisionSessions.reduce((n, s) => n + s.observations.length, 0);
  assert(
    '4. Self Vision produces output',
    observationCount > 0,
    `observations=${observationCount}`,
  );

  const replayEvents = getDevPulseV2RealityReplayAuthority()
    .getReplaySessions()
    .reduce((n, s) => n + s.events.length, 0);
  const consumedObservation = getDevPulseV2RealityReplayAuthority()
    .getReplaySessions()
    .some((s) => s.events.some((e) => e.sourceSystemId === 'self_vision'));
  assert(
    '5. Reality Replay consumes observation output',
    replayEvents > 0 && consumedObservation,
    `replayEvents=${replayEvents} consumed=${consumedObservation}`,
  );

  const sessionEvents = getDevPulseV2SessionReplayAuthority()
    .getSessionReplayRecords()
    .reduce((n, r) => n + r.events.length, 0);
  assert(
    '6. Session Replay consumes replay output',
    sessionEvents > 0,
    `sessionEvents=${sessionEvents}`,
  );

  const predictions = getDevPulseV2FailurePredictionAuthority().getPredictionRecords();
  assert(
    '7. Failure Prediction consumes session output',
    predictions.length > 0,
    `predictions=${predictions.length}`,
  );

  const attributions = getDevPulseV2RootCauseAttributionAuthority().getAttributionRecords();
  assert(
    '8. Root Cause Attribution consumes prediction output',
    attributions.length > 0 && attributions.some((a) => a.supportingPredictionIds.length > 0),
    `attributions=${attributions.length}`,
  );

  const obsReplayHandoff = getHandoff(result, 'observation_to_replay')!;
  assert(
    '9. Observation → Replay handoff validated',
    obsReplayHandoff.sourceProducedOutput &&
      obsReplayHandoff.targetConsumedOutput &&
      obsReplayHandoff.ownershipPreserved,
    obsReplayHandoff.detail ?? '',
  );

  const replaySessionHandoff = getHandoff(result, 'replay_to_session')!;
  assert(
    '10. Replay → Session handoff validated',
    replaySessionHandoff.sourceProducedOutput &&
      replaySessionHandoff.targetConsumedOutput &&
      replaySessionHandoff.ownershipPreserved,
    replaySessionHandoff.detail ?? '',
  );

  const sessionPredictionHandoff = getHandoff(result, 'session_to_prediction')!;
  assert(
    '11. Session → Prediction handoff validated',
    sessionPredictionHandoff.sourceProducedOutput &&
      sessionPredictionHandoff.targetConsumedOutput &&
      sessionPredictionHandoff.ownershipPreserved,
    sessionPredictionHandoff.detail ?? '',
  );

  const predictionAttributionHandoff = getHandoff(result, 'prediction_to_attribution')!;
  assert(
    '12. Prediction → Attribution handoff validated',
    predictionAttributionHandoff.sourceProducedOutput &&
      predictionAttributionHandoff.targetConsumedOutput &&
      predictionAttributionHandoff.ownershipPreserved,
    predictionAttributionHandoff.detail ?? '',
  );

  assert(
    '13. Evidence propagation validated',
    result.evidencePropagationValid && validateEvidencePropagation(),
    `valid=${result.evidencePropagationValid}`,
  );

  assert(
    '14. Timeline propagation validated',
    result.timelinePropagationValid && validateTimelinePropagation(),
    `valid=${result.timelinePropagationValid}`,
  );

  assert(
    '15. Central Brain visibility validated',
    result.brainVisibilityValid && validateBrainVisibility(),
    `valid=${result.brainVisibilityValid}`,
  );

  const ownership = validateOwnershipIntegrity();
  assert(
    '16. Ownership integrity preserved',
    ownership.every((c) => c.preserved),
    `${ownership.filter((c) => c.preserved).length}/${ownership.length} preserved`,
  );

  assert(
    '17. Chat Authority ownership preserved',
    getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      getDevPulseV2Owner('chat_answer_authority').ownerModule === CHAT_OWNER_MODULE,
    CHAT_OWNER_MODULE,
  );

  assert(
    '18. Trust Engine ownership preserved',
    getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    TRUST_OWNER_MODULE,
  );

  assert(
    '19. Project Vault ownership preserved',
    getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    VAULT_OWNER_MODULE,
  );

  assert(
    '20. Evidence Registry ownership preserved',
    getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    REGISTRY_OWNER_MODULE,
  );

  assert(
    '21. Timeline Ledger ownership preserved',
    getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE,
    LEDGER_OWNER_MODULE,
  );

  assert(
    '22. Browser Harness ownership preserved',
    getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    HARNESS_OWNER_MODULE,
  );

  assert(
    '23. Visible UI Guard ownership preserved',
    getDevPulseV2Owner('visible_ui_clickability_guard').ownerModule === GUARD_OWNER_MODULE,
    GUARD_OWNER_MODULE,
  );

  const dupSystems = validateDuplicateDetection();
  assert(
    '24. Duplicate detection passes',
    dupSystems.length === 5 && dupSystems.every((d) => d.active),
    dupSystems.map((d) => `${d.systemId}:${d.active}`).join(', '),
  );

  assert(
    '25. No duplicate ownership claims',
    dupSystems.every((d) => d.noDuplicateClaim && d.ownershipPreserved),
    `systems=${dupSystems.length}`,
  );

  const pipelineResult = validateObservabilityPipeline();
  assert(
    '26. End-to-end pipeline validates',
    pipelineResult.overallStatus === 'PASS' && pipelineResult.handoffs.length === 4,
    `status=${pipelineResult.overallStatus} handoffs=${pipelineResult.handoffs.length}`,
  );

  assert(
    '27. Phase 6 readiness evaluates correctly',
    result.phase6Readiness === PHASE_6_READY,
    result.phase6Readiness,
  );

  assert(
    '28. Validation Budget Policy still passes',
    DevPulseV2ObservabilityStackValidationAuthority.assertValidationBudgetCompatible() &&
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
  assert('29. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  const reportText = formatObservabilityStackValidationReport(
    validator.getValidatorState(),
    validator.listRuns(),
  );
  assert(
    '30. Report generated',
    reportText.includes('Observability Stack Reality Validation Report') &&
      validator.formatReport().includes('Recommendation:'),
    `runs=${validator.getValidatorState().runCount}`,
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
    console.log('====================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(VALIDATION_PASS_TOKEN);
    console.log('');
    console.log('PHASE_6_READY');
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('OBSERVABILITY STACK REALITY VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
