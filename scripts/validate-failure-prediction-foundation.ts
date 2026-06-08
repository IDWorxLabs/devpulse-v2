/**
 * DevPulse V2 Failure Prediction Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import { resetDevPulseV2CentralBrainAuthorityForTests } from '../src/central-brain/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { resetDevPulseV2EvidenceRegistryAuthorityForTests } from '../src/evidence-registry/index.js';
import { REGISTRY_OWNER_MODULE } from '../src/evidence-registry/types.js';
import {
  analyzeFailurePatterns,
  analyzeObservationBridgePatterns,
  analyzeObservationPatterns,
  analyzeRealityReplayPatterns,
  analyzeReplayPatterns,
  analyzeSessionReplayPatterns,
  analyzeVerificationBridgePatterns,
  analyzeVerificationPatterns,
  assertCentralBrainOwnershipUnchanged,
  assertEvidenceRegistryOwnershipUnchanged,
  assertRealityReplayOwnershipUnchanged,
  assertSelfVisionOwnershipUnchanged,
  assertSessionReplayOwnershipUnchanged,
  assertVerificationLoopOwnershipUnchanged,
  BROWSER_VERIFICATION_WARNS_TITLE,
  collectPredictionEvidence,
  DevPulseV2FailurePredictionAuthority,
  formatFailurePredictionReport,
  generatePredictionRecords,
  getObservationPredictionSummary,
  getPredictionEvidenceSummary,
  getRealityPredictionSummary,
  getReplayPredictionSummary,
  getVerificationPredictionSummary,
  PREDICTION_OWNER_MODULE,
  PREDICTION_PASS_TOKEN,
  publishPredictionSummary,
  REPEATED_MISSING_UI_TITLE,
  REPEATED_VALIDATION_FAILURES_TITLE,
  resetDevPulseV2FailurePredictionAuthorityForTests,
  scoreConfidence,
  summarizePredictions,
} from '../src/failure-prediction/index.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { createReplayEvent, resetDevPulseV2RealityReplayAuthorityForTests } from '../src/reality-replay/index.js';
import { REPLAY_OWNER_MODULE } from '../src/reality-replay/types.js';
import { resetDevPulseV2SelfVisionAuthorityForTests } from '../src/self-vision/index.js';
import { SELF_VISION_OWNER_MODULE } from '../src/self-vision/types.js';
import { resetDevPulseV2SessionReplayAuthorityForTests } from '../src/session-replay/index.js';
import { SESSION_REPLAY_OWNER_MODULE } from '../src/session-replay/types.js';
import { TRUST_OWNER_MODULE } from '../src/trust-engine/types.js';
import { resetDevPulseV2VerificationLoopAuthorityForTests } from '../src/verification-loop/index.js';
import { LOOP_OWNER_MODULE } from '../src/verification-loop/types.js';
import { resetDevPulseV2VisibleUiGuardAuthorityForTests } from '../src/visible-ui-guard/index.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

const EMPTY_HTML = '<div id="shell-root"></div>';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function seedRiskPatterns(): void {
  const verification = resetDevPulseV2VerificationLoopAuthorityForTests();
  verification.verifyAndStoreClaim({ subject: 'Validation risk claim A', evidenceIds: [] });
  verification.verifyAndStoreClaim({ subject: 'Validation risk claim B', evidenceIds: [] });

  const guard = resetDevPulseV2VisibleUiGuardAuthorityForTests();
  guard.registerVisibleUiElement({
    elementId: 'MissingPanelA',
    ownerSystemId: 'test_system',
    ownerModule: 'devpulse_v2_test',
    type: 'PANEL',
    label: 'Missing Panel A',
    mountTarget: '#shell-root',
    expectedSelector: '#missing-panel-a',
    interactive: true,
    requiredForPhase: true,
  });
  guard.registerVisibleUiElement({
    elementId: 'MissingPanelB',
    ownerSystemId: 'test_system',
    ownerModule: 'devpulse_v2_test',
    type: 'PANEL',
    label: 'Missing Panel B',
    mountTarget: '#shell-root',
    expectedSelector: '#missing-panel-b',
    interactive: true,
    requiredForPhase: true,
  });
  resetDevPulseV2SelfVisionAuthorityForTests().observeRegisteredUi(EMPTY_HTML);

  const replay = resetDevPulseV2RealityReplayAuthorityForTests();
  replay.createReplaySession([
    createReplayEvent({
      timestamp: Date.now() - 2000,
      sourceSystemId: 'browser_verification_harness',
      eventType: 'BROWSER_CHECK',
      description: 'Visibility check: WARN — expected visible, actual delayed',
      evidenceIds: ['ev-warn-1'],
      warnings: ['Browser check visibility: WARN'],
      errors: [],
    }),
    createReplayEvent({
      timestamp: Date.now() - 1000,
      sourceSystemId: 'browser_verification_harness',
      eventType: 'BROWSER_CHECK',
      description: 'Clickability check: WARN — expected clickable, actual slow',
      evidenceIds: ['ev-warn-2'],
      warnings: ['Browser check clickability: WARN'],
      errors: [],
    }),
  ]);

  resetDevPulseV2SessionReplayAuthorityForTests();
  resetDevPulseV2EvidenceRegistryAuthorityForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Failure Prediction Foundation Validation');
  console.log('======================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 5,
    systems: ['failure_prediction'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts failure_prediction packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  resetDevPulseV2CentralBrainAuthorityForTests();
  seedRiskPatterns();
  const prediction = resetDevPulseV2FailurePredictionAuthorityForTests();

  assert(
    '2. Failure Prediction Authority exists',
    prediction instanceof DevPulseV2FailurePredictionAuthority,
    `ownerModule=${DevPulseV2FailurePredictionAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('failure_prediction');
  assert(
    '3. Ownership registry contains failure_prediction',
    owner.ownerModule === PREDICTION_OWNER_MODULE &&
      DevPulseV2FailurePredictionAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const manualRecord = prediction.createPredictionRecord({
    sourceSystemId: 'failure_prediction',
    title: 'Manual test prediction',
    description: 'Validator seed prediction record',
    riskLevel: 'LOW',
    confidence: 'LOW',
    supportingEvidenceIds: [],
    warnings: [],
    errors: [],
  });
  assert(
    '4. Prediction record can be created',
    manualRecord.predictionId.length > 0,
    manualRecord.predictionId,
  );

  const manualSummary = prediction.createPredictionSummary([manualRecord]);
  assert(
    '5. Prediction summary can be created',
    manualSummary.totalPredictions === 1 && manualSummary.lowRiskCount === 1,
    `total=${manualSummary.totalPredictions}`,
  );

  const failurePatterns = analyzeFailurePatterns();
  assert(
    '6. analyzeFailurePatterns works',
    failurePatterns.length >= 3,
    `patterns=${failurePatterns.length}`,
  );

  const replayPatterns = analyzeReplayPatterns();
  assert(
    '7. analyzeReplayPatterns works',
    replayPatterns.some((p) => p.title === BROWSER_VERIFICATION_WARNS_TITLE),
    `patterns=${replayPatterns.length}`,
  );

  const verificationPatterns = analyzeVerificationPatterns();
  assert(
    '8. analyzeVerificationPatterns works',
    verificationPatterns.some((p) => p.title === REPEATED_VALIDATION_FAILURES_TITLE),
    `patterns=${verificationPatterns.length}`,
  );

  const observationPatterns = analyzeObservationPatterns();
  assert(
    '9. analyzeObservationPatterns works',
    observationPatterns.some((p) => p.title === REPEATED_MISSING_UI_TITLE),
    `patterns=${observationPatterns.length}`,
  );

  const generated = prediction.generatePredictionRecords();
  assert(
    '10. generatePredictionRecords works',
    generated.length >= 3,
    `records=${generated.length}`,
  );

  const summary = summarizePredictions(generated);
  assert(
    '11. summarizePredictions works',
    summary.totalPredictions >= 3 && summary.highRiskCount >= 2,
    `high=${summary.highRiskCount} medium=${summary.mediumRiskCount}`,
  );

  assert(
    '12. Session Replay bridge works',
    assertSessionReplayOwnershipUnchanged() &&
      analyzeSessionReplayPatterns().length >= 0 &&
      getReplayPredictionSummary().length > 0 &&
      getDevPulseV2Owner('session_replay').ownerModule === SESSION_REPLAY_OWNER_MODULE,
    getReplayPredictionSummary(),
  );

  assert(
    '13. Reality Replay bridge works',
    assertRealityReplayOwnershipUnchanged() &&
      analyzeRealityReplayPatterns().some((p) => p.title === BROWSER_VERIFICATION_WARNS_TITLE) &&
      getRealityPredictionSummary().includes('Reality replay patterns') &&
      getDevPulseV2Owner('reality_replay').ownerModule === REPLAY_OWNER_MODULE,
    getRealityPredictionSummary(),
  );

  assert(
    '14. Self Vision bridge works',
    assertSelfVisionOwnershipUnchanged() &&
      analyzeObservationBridgePatterns().some((p) => p.title === REPEATED_MISSING_UI_TITLE) &&
      getObservationPredictionSummary().includes('Observation patterns') &&
      getDevPulseV2Owner('self_vision').ownerModule === SELF_VISION_OWNER_MODULE,
    getObservationPredictionSummary(),
  );

  assert(
    '15. Verification Loop bridge works',
    assertVerificationLoopOwnershipUnchanged() &&
      analyzeVerificationBridgePatterns().some((p) => p.title === REPEATED_VALIDATION_FAILURES_TITLE) &&
      getVerificationPredictionSummary().includes('Verification patterns') &&
      getDevPulseV2Owner('verification_loop').ownerModule === LOOP_OWNER_MODULE,
    getVerificationPredictionSummary(),
  );

  const evidence = collectPredictionEvidence(generated);
  assert(
    '16. Evidence bridge works',
    assertEvidenceRegistryOwnershipUnchanged() &&
      evidence.length >= 3 &&
      getPredictionEvidenceSummary().includes('Prediction evidence') &&
      getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    getPredictionEvidenceSummary(),
  );

  const published = publishPredictionSummary(summary);
  assert(
    '17. Central Brain bridge works',
    assertCentralBrainOwnershipUnchanged() &&
      prediction.getLatestPredictionSummary()?.totalPredictions === published.totalPredictions &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    `predictions=${published.totalPredictions}`,
  );

  const reportText = formatFailurePredictionReport(generated, published, evidence.length);
  assert(
    '18. Prediction report generated',
    reportText.includes('Failure Prediction Report') &&
      reportText.includes(PREDICTION_OWNER_MODULE) &&
      prediction.formatReport().includes('Recommendation:'),
    `predictions=${generated.length}`,
  );

  const validationPrediction = generated.find((p) => p.title === REPEATED_VALIDATION_FAILURES_TITLE);
  assert(
    '19. Repeated validation failures create HIGH risk prediction',
    validationPrediction?.riskLevel === 'HIGH',
    validationPrediction?.description ?? 'missing',
  );

  const uiPrediction = generated.find((p) => p.title === REPEATED_MISSING_UI_TITLE);
  assert(
    '20. Repeated missing UI observations create HIGH risk prediction',
    uiPrediction?.riskLevel === 'HIGH',
    uiPrediction?.description ?? 'missing',
  );

  const browserPrediction = generated.find((p) => p.title === BROWSER_VERIFICATION_WARNS_TITLE);
  assert(
    '21. Browser verification warning pattern creates MEDIUM risk prediction',
    browserPrediction?.riskLevel === 'MEDIUM',
    browserPrediction?.description ?? 'missing',
  );

  assert(
    '22. Risk scoring works',
    generated.every((p) => ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(p.riskLevel)),
    `levels=${generated.map((p) => p.riskLevel).join(',')}`,
  );

  assert(
    '23. Confidence scoring works',
    scoreConfidence('HIGH', 2) === 'MEDIUM' &&
      scoreConfidence('MEDIUM', 3) === 'HIGH' &&
      generated.every((p) => ['LOW', 'MEDIUM', 'HIGH'].includes(p.confidence)),
    `confidences=${generated.map((p) => p.confidence).join(',')}`,
  );

  assert(
    '24. No execution performed',
    DevPulseV2FailurePredictionAuthority.assertDoesNotExecuteActions(),
    'no execute/runAction',
  );

  assert(
    '25. No repairs performed',
    DevPulseV2FailurePredictionAuthority.assertDoesNotPerformRepairs(),
    'no repair/fix/remediate',
  );

  assert(
    '26. No root cause analysis performed',
    DevPulseV2FailurePredictionAuthority.assertDoesNotPerformRootCauseAnalysis(),
    'no rootCause/diagnose/analyzeCause',
  );

  assert(
    '27. No answer authority violation',
    DevPulseV2FailurePredictionAuthority.assertDoesNotBecomeAnswerAuthority() &&
      DevPulseV2FailurePredictionAuthority.assertDoesNotReplaceSessionReplay() &&
      DevPulseV2FailurePredictionAuthority.assertDoesNotReplaceRealityReplay() &&
      DevPulseV2FailurePredictionAuthority.assertDoesNotReplaceTrustEngine() &&
      assertSingleAnswerAuthorityRegistered() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    PREDICTION_OWNER_MODULE,
  );

  assert(
    '28. Validation Budget Policy still passes',
    DevPulseV2FailurePredictionAuthority.assertValidationBudgetCompatible() &&
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

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('======================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(PREDICTION_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('FAILURE PREDICTION FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
