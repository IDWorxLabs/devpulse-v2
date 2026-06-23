/**
 * Phase 26.90 — Stage transition analyzer (V1).
 */

import {
  hasIntakeValidationCompletePropagated,
  hasPlanningGateStartedPropagated,
  hasProductReadinessSimulationCompletePropagated,
} from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import {
  hasPassedTraceEvent,
  resolveMissingIntakeCompletionBoundary,
} from '../founder-test-runtime-monitor/stage2-completion-tracker.js';
import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type {
  ProductReadinessCompletionFailureClass,
  StageTransitionAnalysis,
} from './product-readiness-completion-boundary-repair-types.js';
import { detectProductReadinessCompletion } from './product-readiness-completion-detector.js';

export function analyzeStageTransition(
  snapshot: Pick<
    FounderTestRuntimeSnapshot,
    'state' | 'stages' | 'traceEvents' | 'missingCompletionBoundary' | 'stage2CompletionGap'
  > | null,
  nowMs = Date.now(),
): StageTransitionAnalysis {
  const completion = detectProductReadinessCompletion(nowMs);
  const intakeStage = snapshot?.stages.find((stage) => stage.stageId === 'INTAKE_VALIDATION') ?? null;
  const intakeValidationRunning = intakeStage?.status === 'RUNNING';
  const traceEvents = snapshot?.traceEvents ?? [];

  const missingFromTrace = resolveMissingIntakeCompletionBoundary(traceEvents);
  const missingCompletionBoundary =
    snapshot?.missingCompletionBoundary ?? missingFromTrace;

  const productReadinessTracePassed = hasPassedTraceEvent(
    traceEvents,
    'product-readiness-simulation-complete',
  );
  const intakeTracePassed =
    hasPassedTraceEvent(traceEvents, 'intake-validation-complete') ||
    hasIntakeValidationCompletePropagated();
  const planningGateStarted =
    hasPassedTraceEvent(traceEvents, 'planning-gate-started') ||
    hasPlanningGateStartedPropagated();

  const intakeValidationComplete = intakeTracePassed;
  const planningGateEligible = intakeValidationComplete || intakeTracePassed;

  let failureClass: ProductReadinessCompletionFailureClass = 'NONE';
  let stageAdvancementBlocked = false;
  let reason: string | null = null;

  if (intakeValidationRunning && completion.productReadinessComplete && !productReadinessTracePassed) {
    failureClass = 'PROPAGATION_FAILURE';
    stageAdvancementBlocked = true;
    reason = 'Product readiness complete in registry but runtime trace missing product-readiness-simulation-complete';
  } else if (
    intakeValidationRunning &&
    completion.completionCheckEmitted &&
    !completion.productReadinessCompletePropagated &&
    !productReadinessTracePassed
  ) {
    failureClass = 'STATE_MACHINE_STALLED';
    stageAdvancementBlocked = true;
    reason = `Intake Validation RUNNING after settlement; missing: ${missingCompletionBoundary ?? 'Product readiness simulation complete'}`;
  } else if (intakeValidationRunning && missingCompletionBoundary === 'Intake validation complete') {
    failureClass = 'STAGE_ADVANCEMENT_FAILED';
    stageAdvancementBlocked = true;
    reason = 'Product readiness complete but intake validation did not advance';
  } else if (intakeValidationComplete && !planningGateStarted && !planningGateEligible) {
    failureClass = 'STAGE_ADVANCEMENT_FAILED';
    stageAdvancementBlocked = true;
    reason = 'Intake validation complete but Planning Gate not eligible';
  } else if (snapshot?.stage2CompletionGap) {
    failureClass = completion.failureClass !== 'NONE' ? completion.failureClass : 'STATE_MACHINE_STALLED';
    stageAdvancementBlocked = true;
    reason = snapshot.missingCompletionBoundary
      ? `Stage 2 gap: ${snapshot.missingCompletionBoundary}`
      : 'Stage 2 completion gap detected';
  }

  return {
    readOnly: true,
    intakeValidationRunning,
    intakeValidationComplete,
    planningGateEligible: intakeValidationComplete || (!intakeValidationRunning && !stageAdvancementBlocked),
    missingCompletionBoundary,
    stageAdvancementBlocked,
    failureClass,
    reason,
  };
}
