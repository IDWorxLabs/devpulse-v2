/**
 * Observability stack validation engine — real pipeline, no mocks, no replacement systems.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { HARNESS_OWNER_MODULE } from '../browser-verification/types.js';
import {
  resetDevPulseV2EvidenceRegistryAuthorityForTests,
  getDevPulseV2EvidenceRegistryAuthority,
} from '../evidence-registry/evidence-registry-authority.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import {
  collectPredictionEvidence,
  getDevPulseV2FailurePredictionAuthority,
  getLatestPredictionSummary,
  publishPredictionSummary,
  resetDevPulseV2FailurePredictionAuthorityForTests,
  summarizePredictions,
} from '../failure-prediction/index.js';
import { PREDICTION_OWNER_MODULE } from '../failure-prediction/types.js';
import { getDevPulseV2Owner, assertSingleOwner } from '../foundation/ownership-registry.js';
import {
  collectAttributionEvidence,
  getDevPulseV2RootCauseAttributionAuthority,
  getLatestAttributionSummary,
  publishAttributionSummary,
  resetDevPulseV2RootCauseAttributionAuthorityForTests,
  summarizeAttributions,
} from '../root-cause-attribution/index.js';
import { assertFailurePredictionOwnershipUnchanged } from '../root-cause-attribution/attribution-prediction-bridge.js';
import { ATTRIBUTION_OWNER_MODULE } from '../root-cause-attribution/types.js';
import {
  createReplayEvent,
  resetDevPulseV2RealityReplayAuthorityForTests,
  getDevPulseV2RealityReplayAuthority,
} from '../reality-replay/index.js';
import { assertSelfVisionOwnershipUnchanged } from '../reality-replay/replay-self-vision-bridge.js';
import { assertRealityReplayOwnershipUnchanged } from '../session-replay/session-reality-replay-bridge.js';
import { REPLAY_OWNER_MODULE } from '../reality-replay/types.js';
import {
  resetDevPulseV2SelfVisionAuthorityForTests,
  getDevPulseV2SelfVisionAuthority,
} from '../self-vision/self-vision-authority.js';
import { SELF_VISION_OWNER_MODULE } from '../self-vision/types.js';
import {
  resetDevPulseV2SessionReplayAuthorityForTests,
  getDevPulseV2SessionReplayAuthority,
} from '../session-replay/session-replay-authority.js';
import { assertSessionReplayOwnershipUnchanged } from '../failure-prediction/prediction-session-replay-bridge.js';
import { SESSION_REPLAY_OWNER_MODULE } from '../session-replay/types.js';
import {
  resetDevPulseV2TimelineLedgerAuthorityForTests,
  getDevPulseV2TimelineLedgerAuthority,
} from '../timeline-ledger/timeline-ledger-authority.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { GUARD_OWNER_MODULE } from '../visible-ui-guard/types.js';
import { resetDevPulseV2VisibleUiGuardAuthorityForTests } from '../visible-ui-guard/visible-ui-guard-authority.js';
import {
  getDevPulseV2VerificationLoopAuthority,
  resetDevPulseV2VerificationLoopAuthorityForTests,
} from '../verification-loop/verification-loop-authority.js';
import { LOOP_OWNER_MODULE } from '../verification-loop/types.js';
import type {
  DuplicateDetectionStatus,
  ObservabilityHandoff,
  ObservabilityValidationResult,
  OwnershipIntegrityCheck,
  Phase6Readiness,
} from './types.js';
import { OBSERVABILITY_STACK_VALIDATION_HTML, OBSERVABILITY_SYSTEMS } from './types.js';

function createValidationId(): string {
  return `obs-val-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeHandoff(
  handoffId: ObservabilityHandoff['handoffId'],
  sourceSystem: string,
  targetSystem: string,
  sourceProducedOutput: boolean,
  targetConsumedOutput: boolean,
  ownershipPreserved: boolean,
  detail: string,
): ObservabilityHandoff {
  return {
    handoffId,
    sourceSystem,
    targetSystem,
    sourceProducedOutput,
    targetConsumedOutput,
    ownershipPreserved,
    detail,
  };
}

export function validateOwnershipIntegrity(): OwnershipIntegrityCheck[] {
  return [
    {
      domain: 'chat_authority',
      expectedOwner: CHAT_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('chat_authority').ownerModule,
      preserved: getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE,
    },
    {
      domain: 'trust_engine',
      expectedOwner: TRUST_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('trust_engine').ownerModule,
      preserved: getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    },
    {
      domain: 'project_vault',
      expectedOwner: VAULT_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('project_vault').ownerModule,
      preserved: getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    },
    {
      domain: 'evidence_registry',
      expectedOwner: REGISTRY_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('evidence_registry').ownerModule,
      preserved: getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    },
    {
      domain: 'timeline_event_ledger',
      expectedOwner: LEDGER_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('timeline_event_ledger').ownerModule,
      preserved: getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE,
    },
    {
      domain: 'central_brain',
      expectedOwner: CENTRAL_BRAIN_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('central_brain').ownerModule,
      preserved: getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    },
    {
      domain: 'visible_ui_clickability_guard',
      expectedOwner: GUARD_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('visible_ui_clickability_guard').ownerModule,
      preserved: getDevPulseV2Owner('visible_ui_clickability_guard').ownerModule === GUARD_OWNER_MODULE,
    },
    {
      domain: 'browser_verification_harness',
      expectedOwner: HARNESS_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('browser_verification_harness').ownerModule,
      preserved: getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    },
    {
      domain: 'self_vision',
      expectedOwner: SELF_VISION_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('self_vision').ownerModule,
      preserved: getDevPulseV2Owner('self_vision').ownerModule === SELF_VISION_OWNER_MODULE,
    },
    {
      domain: 'verification_loop',
      expectedOwner: LOOP_OWNER_MODULE,
      actualOwner: getDevPulseV2Owner('verification_loop').ownerModule,
      preserved: getDevPulseV2Owner('verification_loop').ownerModule === LOOP_OWNER_MODULE,
    },
  ];
}

export function validateDuplicateDetection(): DuplicateDetectionStatus[] {
  const observabilityDomains = [
    { systemId: 'self_vision', domain: 'self_vision' as const, expected: SELF_VISION_OWNER_MODULE },
    { systemId: 'reality_replay', domain: 'reality_replay' as const, expected: REPLAY_OWNER_MODULE },
    { systemId: 'session_replay', domain: 'session_replay' as const, expected: SESSION_REPLAY_OWNER_MODULE },
    { systemId: 'failure_prediction', domain: 'failure_prediction' as const, expected: PREDICTION_OWNER_MODULE },
    { systemId: 'root_cause_attribution', domain: 'root_cause_attribution' as const, expected: ATTRIBUTION_OWNER_MODULE },
  ];

  return observabilityDomains.map(({ systemId, domain, expected }) => {
    const singleOwner = assertSingleOwner(domain);
    const owner = getDevPulseV2Owner(domain);
    return {
      systemId,
      noDuplicateClaim: singleOwner.ok,
      ownershipPreserved: owner.ownerModule === expected,
      active: singleOwner.ok && owner.ownerModule === expected,
    };
  });
}

export function analyzeEvidence() {
  const records = getDevPulseV2EvidenceRegistryAuthority().listEvidence();
  return {
    recordCount: records.length,
    failCount: records.filter((r) => r.status === 'FAIL').length,
    warnCount: records.filter((r) => r.status === 'WARN').length,
    evidenceIds: records.map((r) => r.evidenceId),
  };
}

export function analyzeReplayHistory() {
  const replaySessions = getDevPulseV2RealityReplayAuthority().getReplaySessions();
  const sessionRecords = getDevPulseV2SessionReplayAuthority().getSessionReplayRecords();
  return {
    replayEventCount: replaySessions.reduce((n, s) => n + s.events.length, 0),
    sessionEventCount: sessionRecords.reduce((n, r) => n + r.events.length, 0),
    replaySessionCount: replaySessions.length,
    sessionRecordCount: sessionRecords.length,
  };
}

export function analyzePredictionSignals() {
  const predictions = getDevPulseV2FailurePredictionAuthority().getPredictionRecords();
  return {
    predictionCount: predictions.length,
    highRiskCount: predictions.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length,
    predictionIds: predictions.map((p) => p.predictionId),
  };
}

export function validateObservationToReplay(): ObservabilityHandoff {
  const sessions = getDevPulseV2SelfVisionAuthority().getObservationSessions();
  const observationCount = sessions.reduce((n, s) => n + s.observations.length, 0);
  const replaySession = getDevPulseV2RealityReplayAuthority().replayObservationHistory();
  const consumed = replaySession.events.some((e) => e.sourceSystemId === 'self_vision');

  return makeHandoff(
    'observation_to_replay',
    'self_vision',
    'reality_replay',
    observationCount > 0,
    consumed && replaySession.events.length > 0,
    assertSelfVisionOwnershipUnchanged() &&
      assertRealityReplayOwnershipUnchanged() &&
      getDevPulseV2Owner('self_vision').ownerModule === SELF_VISION_OWNER_MODULE,
    `observations=${observationCount} replayEvents=${replaySession.events.length}`,
  );
}

export function validateReplayToSession(): ObservabilityHandoff {
  const replaySessions = getDevPulseV2RealityReplayAuthority().getReplaySessions();
  const replayEvents = replaySessions.reduce((n, s) => n + s.events.length, 0);
  const sessionRecords = getDevPulseV2SessionReplayAuthority().getSessionReplayRecords();
  const sessionEvents = sessionRecords.reduce((n, r) => n + r.events.length, 0);

  return makeHandoff(
    'replay_to_session',
    'reality_replay',
    'session_replay',
    replayEvents > 0,
    sessionEvents > 0 && sessionRecords.length > 0,
    assertRealityReplayOwnershipUnchanged() &&
      assertSessionReplayOwnershipUnchanged() &&
      getDevPulseV2Owner('reality_replay').ownerModule === REPLAY_OWNER_MODULE,
    `replayEvents=${replayEvents} sessionEvents=${sessionEvents}`,
  );
}

export function validateSessionToPrediction(): ObservabilityHandoff {
  const sessionEvents = getDevPulseV2SessionReplayAuthority()
    .getSessionReplayRecords()
    .reduce((n, r) => n + r.events.length, 0);
  const predictions = getDevPulseV2FailurePredictionAuthority().getPredictionRecords();

  return makeHandoff(
    'session_to_prediction',
    'session_replay',
    'failure_prediction',
    sessionEvents > 0,
    predictions.length > 0 && assertFailurePredictionOwnershipUnchanged(),
    assertSessionReplayOwnershipUnchanged() &&
      getDevPulseV2Owner('failure_prediction').ownerModule === PREDICTION_OWNER_MODULE,
    `sessionEvents=${sessionEvents} predictions=${predictions.length}`,
  );
}

export function validatePredictionToAttribution(): ObservabilityHandoff {
  const predictions = getDevPulseV2FailurePredictionAuthority().getPredictionRecords();
  const attributions = getDevPulseV2RootCauseAttributionAuthority().getAttributionRecords();
  const consumed = attributions.some((a) => a.supportingPredictionIds.length > 0);

  return makeHandoff(
    'prediction_to_attribution',
    'failure_prediction',
    'root_cause_attribution',
    predictions.length > 0,
    attributions.length > 0 && consumed,
    assertFailurePredictionOwnershipUnchanged() &&
      getDevPulseV2Owner('root_cause_attribution').ownerModule === ATTRIBUTION_OWNER_MODULE,
    `predictions=${predictions.length} attributions=${attributions.length}`,
  );
}

export function validateEvidencePropagation(): boolean {
  const records = getDevPulseV2EvidenceRegistryAuthority().listEvidence();
  const hasObservation = records.some(
    (r) => r.tags.includes('self_vision') || r.relatedSystemId === 'self_vision',
  );
  const hasPrediction = records.some((r) => r.tags.includes('failure_prediction'));
  const hasAttribution = records.some((r) => r.tags.includes('root_cause_attribution'));
  return records.length > 0 && hasObservation && (hasPrediction || hasAttribution);
}

export function validateTimelinePropagation(): boolean {
  return getDevPulseV2TimelineLedgerAuthority().listEvents().length > 0;
}

export function validateBrainVisibility(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  const stateOk = typeof brain.getBrainState === 'function';
  const selfVisionSummary = getDevPulseV2SelfVisionAuthority().getLatestObservationSummary();
  const predictionSummary = getLatestPredictionSummary();
  const attributionSummary = getLatestAttributionSummary();

  return (
    stateOk &&
    getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE &&
    selfVisionSummary !== null &&
    predictionSummary !== null &&
    attributionSummary !== null
  );
}

export function determinePhase6Readiness(
  handoffs: ObservabilityHandoff[],
  ownershipChecks: OwnershipIntegrityCheck[],
  result: Pick<
    ObservabilityValidationResult,
    'errors' | 'evidencePropagationValid' | 'timelinePropagationValid' | 'brainVisibilityValid' | 'overallStatus'
  >,
): Phase6Readiness {
  const allHandoffsValid = handoffs.every(
    (h) => h.sourceProducedOutput && h.targetConsumedOutput && h.ownershipPreserved,
  );
  const noOwnershipViolations = ownershipChecks.every((c) => c.preserved);
  const answerAuthorityOk = assertSingleAnswerAuthorityRegistered();

  if (
    allHandoffsValid &&
    noOwnershipViolations &&
    answerAuthorityOk &&
    result.evidencePropagationValid &&
    result.timelinePropagationValid &&
    result.brainVisibilityValid &&
    result.overallStatus === 'PASS' &&
    result.errors.length === 0
  ) {
    return 'READY';
  }
  return 'NOT_READY';
}

function seedObservabilityPipeline(): void {
  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetDevPulseV2EvidenceRegistryAuthorityForTests();
  resetDevPulseV2FailurePredictionAuthorityForTests();
  resetDevPulseV2RootCauseAttributionAuthorityForTests();
  resetDevPulseV2RealityReplayAuthorityForTests();
  resetDevPulseV2SessionReplayAuthorityForTests();

  const verification = resetDevPulseV2VerificationLoopAuthorityForTests();
  verification.verifyAndStoreClaim({ subject: 'Observability stack claim A', evidenceIds: [] });
  verification.verifyAndStoreClaim({ subject: 'Observability stack claim B', evidenceIds: [] });

  const guard = resetDevPulseV2VisibleUiGuardAuthorityForTests();
  guard.registerVisibleUiElement({
    elementId: 'ExpensePanel',
    ownerSystemId: 'expense_system',
    ownerModule: 'devpulse_v2_expense_panel',
    type: 'PANEL',
    label: 'Expense Panel',
    mountTarget: '#shell-root',
    expectedSelector: '#expense-panel',
    interactive: true,
    requiredForPhase: true,
  });
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

  const selfVision = resetDevPulseV2SelfVisionAuthorityForTests();
  const observationSession = selfVision.observeRegisteredUi(OBSERVABILITY_STACK_VALIDATION_HTML);
  const firstObservation = observationSession.observations[0];
  if (firstObservation) {
    selfVision.recordObservationEvent(firstObservation);
    selfVision.recordObservationSession(observationSession);
    selfVision.publishObservationEvidence(firstObservation);
    selfVision.publishObservationSummary(selfVision.summarizeObservations(observationSession));
  }

  const replay = getDevPulseV2RealityReplayAuthority();
  replay.createReplaySession([
    createReplayEvent({
      timestamp: Date.now() - 2000,
      sourceSystemId: 'browser_verification_harness',
      eventType: 'BROWSER_CHECK',
      description: 'Visibility check: WARN — expected visible, actual delayed',
      evidenceIds: ['ev-obs-warn-1'],
      warnings: ['Browser check visibility: WARN'],
      errors: [],
    }),
    createReplayEvent({
      timestamp: Date.now() - 1000,
      sourceSystemId: 'browser_verification_harness',
      eventType: 'BROWSER_CHECK',
      description: 'Clickability check: WARN — delayed response',
      evidenceIds: ['ev-obs-warn-2'],
      warnings: ['Browser check clickability: WARN'],
      errors: [],
    }),
  ]);
  replay.reconstructTimeline();

  getDevPulseV2SessionReplayAuthority().reconstructSession();

  const predictions = getDevPulseV2FailurePredictionAuthority().generatePredictionRecords();
  collectPredictionEvidence(predictions);
  publishPredictionSummary(summarizePredictions(predictions));

  const attributions = getDevPulseV2RootCauseAttributionAuthority().generateAttributions();
  collectAttributionEvidence(attributions);
  publishAttributionSummary(summarizeAttributions(attributions));
}

export function runObservabilityStackValidation(): ObservabilityValidationResult {
  const warnings: string[] = [
    'Observability Stack Reality Validation — integration verification only, no code generation, execution, or repair.',
  ];
  const errors: string[] = [];

  seedObservabilityPipeline();

  const handoffs: ObservabilityHandoff[] = [
    validateObservationToReplay(),
    validateReplayToSession(),
    validateSessionToPrediction(),
    validatePredictionToAttribution(),
  ];

  const ownershipChecks = validateOwnershipIntegrity();
  const duplicateDetection = validateDuplicateDetection();
  const evidencePropagationValid = validateEvidencePropagation();
  const timelinePropagationValid = validateTimelinePropagation();
  const brainVisibilityValid = validateBrainVisibility();

  for (const h of handoffs) {
    if (!h.sourceProducedOutput || !h.targetConsumedOutput || !h.ownershipPreserved) {
      errors.push(`Handoff failed: ${h.handoffId} — ${h.detail ?? ''}`);
    }
  }

  for (const c of ownershipChecks) {
    if (!c.preserved) {
      errors.push(`Ownership violation: ${c.domain} expected ${c.expectedOwner} got ${c.actualOwner}`);
    }
  }

  if (!duplicateDetection.every((d) => d.active)) {
    errors.push('Duplicate observability system detection failed.');
  }

  if (!evidencePropagationValid) {
    errors.push('Evidence propagation not validated across observability pipeline.');
  }

  if (!timelinePropagationValid) {
    errors.push('Timeline propagation not validated.');
  }

  if (!brainVisibilityValid) {
    errors.push('Central Brain visibility not validated.');
  }

  const overallStatus: ObservabilityValidationResult['overallStatus'] =
    errors.length > 0 ? 'FAIL' : 'PASS';

  const result: ObservabilityValidationResult = {
    validationId: createValidationId(),
    createdAt: Date.now(),
    handoffs,
    ownershipChecks,
    duplicateDetection,
    evidencePropagationValid,
    timelinePropagationValid,
    brainVisibilityValid,
    warnings,
    errors,
    overallStatus,
    phase6Readiness: 'NOT_READY',
  };

  result.phase6Readiness = determinePhase6Readiness(handoffs, ownershipChecks, result);

  if (result.phase6Readiness === 'READY') {
    warnings.push('All observability handoffs validated — Phase 6 readiness confirmed (PHASE_6_READY).');
  } else {
    warnings.push('Phase 6 not ready — resolve observability handoff or ownership issues.');
  }

  return result;
}

export function validateObservabilityPipeline(): ObservabilityValidationResult {
  return runObservabilityStackValidation();
}

export function summarizeObservabilityStackValidation(result: ObservabilityValidationResult): string {
  const successful = result.handoffs.filter(
    (h) => h.sourceProducedOutput && h.targetConsumedOutput && h.ownershipPreserved,
  ).length;
  return (
    `Validation ${result.validationId}: handoffs=${successful}/${result.handoffs.length} ` +
    `status=${result.overallStatus} phase6=${result.phase6Readiness} ` +
    `systems=${OBSERVABILITY_SYSTEMS.length}`
  );
}
