/**
 * DevPulse V2 Root Cause Attribution Foundation — validation scenarios.
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
  resetDevPulseV2FailurePredictionAuthorityForTests,
} from '../src/failure-prediction/index.js';
import { PREDICTION_OWNER_MODULE } from '../src/failure-prediction/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { createReplayEvent, resetDevPulseV2RealityReplayAuthorityForTests } from '../src/reality-replay/index.js';
import {
  analyzeEvidence,
  analyzeObservationHistory,
  analyzePredictionSignals,
  analyzeReplayHistory,
  analyzeSessionReplayHistory,
  analyzeVerificationHistory,
  assertCentralBrainOwnershipUnchanged,
  assertEvidenceRegistryOwnershipUnchanged,
  assertFailurePredictionOwnershipUnchanged,
  assertSelfVisionOwnershipUnchanged,
  assertSessionReplayOwnershipUnchanged,
  assertVerificationLoopOwnershipUnchanged,
  ATTRIBUTION_OWNER_MODULE,
  ATTRIBUTION_PASS_TOKEN,
  CLICKABILITY_ATTRIBUTION_TITLE,
  collectAttributionEvidence,
  DevPulseV2RootCauseAttributionAuthority,
  formatRootCauseAttributionReport,
  generateAttributions,
  generateCauseCandidates,
  getEvidenceAttributionSummary,
  getObservationAttributionSummary,
  getPredictionAttributionSummary,
  getReplayAttributionSummary,
  getVerificationAttributionSummary,
  publishAttributionSummary,
  resetDevPulseV2RootCauseAttributionAuthorityForTests,
  scoreAttributionConfidence,
  summarizeAttributions,
  UI_VISIBILITY_ATTRIBUTION_TITLE,
  VERIFICATION_ATTRIBUTION_TITLE,
} from '../src/root-cause-attribution/index.js';
import { resetDevPulseV2SelfVisionAuthorityForTests, getDevPulseV2SelfVisionAuthority } from '../src/self-vision/index.js';
import { SELF_VISION_OWNER_MODULE } from '../src/self-vision/types.js';
import { resetDevPulseV2SessionReplayAuthorityForTests } from '../src/session-replay/index.js';
import { SESSION_REPLAY_OWNER_MODULE } from '../src/session-replay/types.js';
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
const NOT_CLICKABLE_HTML =
  '<div id="shell-root"><span id="control-a">A</span><span id="control-b">B</span></div>';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function seedAttributionSignals(): void {
  const verification = resetDevPulseV2VerificationLoopAuthorityForTests();
  verification.verifyAndStoreClaim({ subject: 'Attribution validation claim A', evidenceIds: [] });
  verification.verifyAndStoreClaim({ subject: 'Attribution validation claim B', evidenceIds: [] });

  const guard = resetDevPulseV2VisibleUiGuardAuthorityForTests();
  guard.registerVisibleUiElement({
    elementId: 'HiddenPanelA',
    ownerSystemId: 'test_system',
    ownerModule: 'devpulse_v2_test',
    type: 'PANEL',
    label: 'Hidden A',
    mountTarget: '#shell-root',
    expectedSelector: '#hidden-a',
    interactive: false,
    requiredForPhase: true,
  });
  guard.registerVisibleUiElement({
    elementId: 'HiddenPanelB',
    ownerSystemId: 'test_system',
    ownerModule: 'devpulse_v2_test',
    type: 'PANEL',
    label: 'Hidden B',
    mountTarget: '#shell-root',
    expectedSelector: '#hidden-b',
    interactive: false,
    requiredForPhase: true,
  });
  resetDevPulseV2SelfVisionAuthorityForTests().observeRegisteredUi(EMPTY_HTML);

  guard.registerVisibleUiElement({
    elementId: 'ControlA',
    ownerSystemId: 'test_system',
    ownerModule: 'devpulse_v2_test',
    type: 'BUTTON',
    label: 'Control A',
    mountTarget: '#shell-root',
    expectedSelector: '#control-a',
    interactive: true,
    requiredForPhase: false,
  });
  guard.registerVisibleUiElement({
    elementId: 'ControlB',
    ownerSystemId: 'test_system',
    ownerModule: 'devpulse_v2_test',
    type: 'BUTTON',
    label: 'Control B',
    mountTarget: '#shell-root',
    expectedSelector: '#control-b',
    interactive: true,
    requiredForPhase: false,
  });
  getDevPulseV2SelfVisionAuthority().observeRegisteredUi(NOT_CLICKABLE_HTML);

  resetDevPulseV2RealityReplayAuthorityForTests().createReplaySession([
    createReplayEvent({
      timestamp: Date.now() - 2000,
      sourceSystemId: 'browser_verification_harness',
      eventType: 'BROWSER_CHECK',
      description: 'Clickability check: WARN — slow response',
      evidenceIds: ['ev-warn-a'],
      warnings: ['Browser WARN'],
      errors: [],
    }),
    createReplayEvent({
      timestamp: Date.now() - 1000,
      sourceSystemId: 'browser_verification_harness',
      eventType: 'BROWSER_CHECK',
      description: 'Visibility check: WARN — delayed render',
      evidenceIds: ['ev-warn-b'],
      warnings: ['Browser WARN'],
      errors: [],
    }),
  ]);

  resetDevPulseV2SessionReplayAuthorityForTests().reconstructSession();
  resetDevPulseV2EvidenceRegistryAuthorityForTests();
  resetDevPulseV2FailurePredictionAuthorityForTests().generatePredictionRecords();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Root Cause Attribution Foundation Validation');
  console.log('==========================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 5,
    systems: ['root_cause_attribution'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts root_cause_attribution packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  resetDevPulseV2CentralBrainAuthorityForTests();
  seedAttributionSignals();
  const attribution = resetDevPulseV2RootCauseAttributionAuthorityForTests();

  assert(
    '2. Root Cause Attribution Authority exists',
    attribution instanceof DevPulseV2RootCauseAttributionAuthority,
    `ownerModule=${DevPulseV2RootCauseAttributionAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('root_cause_attribution');
  assert(
    '3. Ownership registry contains root_cause_attribution',
    owner.ownerModule === ATTRIBUTION_OWNER_MODULE &&
      DevPulseV2RootCauseAttributionAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const manualRecord = attribution.createAttributionRecord({
    title: 'Manual attribution',
    description: 'Validator seed record',
    category: 'UNKNOWN',
    confidence: 'LOW',
    supportingEvidenceIds: [],
    supportingPredictionIds: [],
    warnings: [],
    errors: [],
  });
  assert(
    '4. Attribution record can be created',
    manualRecord.attributionId.length > 0,
    manualRecord.attributionId,
  );

  const manualSummary = attribution.createAttributionSummary([manualRecord]);
  assert(
    '5. Attribution summary can be created',
    manualSummary.attributionCount === 1 && manualSummary.lowConfidenceCount === 1,
    `count=${manualSummary.attributionCount}`,
  );

  const evidenceSignals = analyzeEvidence();
  assert(
    '6. analyzeEvidence works',
    typeof evidenceSignals.failCount === 'number',
    `fail=${evidenceSignals.failCount} warn=${evidenceSignals.warnCount}`,
  );

  const replaySignals = analyzeReplayHistory();
  assert(
    '7. analyzeReplayHistory works',
    replaySignals.browserWarnCount >= 2,
    `browserWarn=${replaySignals.browserWarnCount}`,
  );

  const predictionSignals = analyzePredictionSignals();
  assert(
    '8. analyzePredictionSignals works',
    predictionSignals.predictions.length >= 1,
    `predictions=${predictionSignals.predictions.length}`,
  );

  const candidates = generateCauseCandidates();
  assert(
    '9. generateCauseCandidates works',
    candidates.length >= 3,
    `candidates=${candidates.length}`,
  );

  const generated = attribution.generateAttributions();
  assert(
    '10. generateAttributions works',
    generated.length >= 3,
    `attributions=${generated.length}`,
  );

  const summary = summarizeAttributions(generated);
  assert(
    '11. summarizeAttributions works',
    summary.attributionCount >= 3 && summary.highConfidenceCount >= 1,
    `high=${summary.highConfidenceCount}`,
  );

  assert(
    '12. Failure Prediction bridge works',
    assertFailurePredictionOwnershipUnchanged() &&
      analyzePredictionSignals().highRiskCount >= 1 &&
      getPredictionAttributionSummary().includes('Prediction signals') &&
      getDevPulseV2Owner('failure_prediction').ownerModule === PREDICTION_OWNER_MODULE,
    getPredictionAttributionSummary(),
  );

  assert(
    '13. Session Replay bridge works',
    assertSessionReplayOwnershipUnchanged() &&
      analyzeSessionReplayHistory().events.length >= 1 &&
      getReplayAttributionSummary().includes('Session replay signals') &&
      getDevPulseV2Owner('session_replay').ownerModule === SESSION_REPLAY_OWNER_MODULE,
    getReplayAttributionSummary(),
  );

  assert(
    '14. Self Vision bridge works',
    assertSelfVisionOwnershipUnchanged() &&
      analyzeObservationHistory().hiddenCount >= 2 &&
      analyzeObservationHistory().notClickableCount >= 2 &&
      getObservationAttributionSummary().includes('Observation signals') &&
      getDevPulseV2Owner('self_vision').ownerModule === SELF_VISION_OWNER_MODULE,
    getObservationAttributionSummary(),
  );

  assert(
    '15. Verification bridge works',
    assertVerificationLoopOwnershipUnchanged() &&
      analyzeVerificationHistory().failureCount >= 2 &&
      getVerificationAttributionSummary().includes('Verification signals') &&
      getDevPulseV2Owner('verification_loop').ownerModule === LOOP_OWNER_MODULE,
    getVerificationAttributionSummary(),
  );

  const evidenceCollected = collectAttributionEvidence(generated);
  assert(
    '16. Evidence bridge works',
    assertEvidenceRegistryOwnershipUnchanged() &&
      evidenceCollected.length >= 3 &&
      getEvidenceAttributionSummary().includes('Evidence signals') &&
      getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    getEvidenceAttributionSummary(),
  );

  const published = publishAttributionSummary(summary);
  assert(
    '17. Central Brain bridge works',
    assertCentralBrainOwnershipUnchanged() &&
      attribution.getLatestAttributionSummary()?.attributionCount === published.attributionCount &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    `attributions=${published.attributionCount}`,
  );

  const reportText = formatRootCauseAttributionReport(generated, published);
  assert(
    '18. Attribution report generated',
    reportText.includes('Root Cause Attribution Report') &&
      reportText.includes(ATTRIBUTION_OWNER_MODULE) &&
      attribution.formatReport().includes('Recommendation:'),
    `attributions=${generated.length}`,
  );

  const clickability = generated.find((a) => a.title === CLICKABILITY_ATTRIBUTION_TITLE);
  assert(
    '19. Repeated clickability failures produce CLICKABILITY attribution',
    clickability?.category === 'CLICKABILITY' && clickability.confidence === 'HIGH',
    clickability?.description ?? 'missing',
  );

  const visibility = generated.find((a) => a.title === UI_VISIBILITY_ATTRIBUTION_TITLE);
  assert(
    '20. Repeated hidden UI produces UI_VISIBILITY attribution',
    visibility?.category === 'UI_VISIBILITY',
    visibility?.description ?? 'missing',
  );

  const verificationAttr = generated.find((a) => a.title === VERIFICATION_ATTRIBUTION_TITLE);
  assert(
    '21. Repeated verification failures produce VERIFICATION attribution',
    verificationAttr?.category === 'VERIFICATION',
    verificationAttr?.description ?? 'missing',
  );

  assert(
    '22. Attribution confidence scoring works',
    scoreAttributionConfidence(3, true, true) === 'HIGH' &&
      scoreAttributionConfidence(2, true, false) === 'HIGH' &&
      generated.every((a) => ['LOW', 'MEDIUM', 'HIGH'].includes(a.confidence)),
    `confidences=${generated.map((a) => a.confidence).join(',')}`,
  );

  assert(
    '23. Evidence linking works',
    generated.some((a) => a.supportingEvidenceIds.length >= 2) &&
      evidenceCollected.every((e) => e.tags.includes('root_cause_attribution')),
    `evidence=${evidenceCollected.length}`,
  );

  assert(
    '24. Prediction linking works',
    generated.some((a) => a.supportingPredictionIds.length >= 1),
    `linked=${generated.filter((a) => a.supportingPredictionIds.length > 0).length}`,
  );

  assert(
    '25. No execution performed',
    DevPulseV2RootCauseAttributionAuthority.assertDoesNotExecuteActions(),
    'no execute/runAction',
  );

  assert(
    '26. No repairs performed',
    DevPulseV2RootCauseAttributionAuthority.assertDoesNotPerformRepairs(),
    'no repair/fix/remediate',
  );

  assert(
    '27. No recovery performed',
    DevPulseV2RootCauseAttributionAuthority.assertDoesNotPerformRecovery(),
    'no recover/rollback/performRecovery',
  );

  assert(
    '28. No answer authority violation',
    DevPulseV2RootCauseAttributionAuthority.assertDoesNotBecomeAnswerAuthority() &&
      DevPulseV2RootCauseAttributionAuthority.assertDoesNotReplaceFailurePrediction() &&
      DevPulseV2RootCauseAttributionAuthority.assertDoesNotReplaceVerificationLoop() &&
      DevPulseV2RootCauseAttributionAuthority.assertDoesNotReplaceEvidenceRegistry() &&
      assertSingleAnswerAuthorityRegistered() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE,
    ATTRIBUTION_OWNER_MODULE,
  );

  assert(
    '29. Validation Budget Policy still passes',
    DevPulseV2RootCauseAttributionAuthority.assertValidationBudgetCompatible() &&
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
  assert('30. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('==========================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(ATTRIBUTION_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('ROOT CAUSE ATTRIBUTION FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
