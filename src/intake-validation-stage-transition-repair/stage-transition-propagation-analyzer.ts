/**
 * Phase 27.05 — Stage transition propagation analyzer (V1).
 */

import { hasPassedTraceEvent } from '../founder-test-runtime-monitor/stage2-completion-tracker.js';
import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type {
  IntakeValidationBoundaryAudit,
  IntakeValidationCompletionDetection,
  StageTransitionPropagationAnalysis,
} from './intake-validation-stage-transition-repair-types.js';
import {
  INTAKE_VALIDATION_COMPLETE,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
} from './intake-validation-stage-transition-repair-registry.js';

export function analyzeStageTransitionPropagation(input: {
  runtimeSnapshot?: Pick<FounderTestRuntimeSnapshot, 'traceEvents' | 'stages'> | null;
  boundaryAudit: IntakeValidationBoundaryAudit;
  completionDetection: IntakeValidationCompletionDetection;
}): StageTransitionPropagationAnalysis {
  const traceEvents = input.runtimeSnapshot?.traceEvents ?? [];
  const artifactsBuiltEmitted = hasPassedTraceEvent(traceEvents, LAUNCH_READINESS_ARTIFACTS_BUILT);
  const intakeCompleteEmitted = hasPassedTraceEvent(traceEvents, INTAKE_VALIDATION_COMPLETE);

  const propagationStoppedAfterArtifactsBuilt =
    artifactsBuiltEmitted && !intakeCompleteEmitted && input.boundaryAudit.intakeStageRunning;

  const intakePassNotPropagated =
    input.completionDetection.intakeValidationComplete && input.boundaryAudit.intakeStageRunning;

  const completionEventDropped =
    input.boundaryAudit.rule1Satisfied &&
    !intakeCompleteEmitted &&
    !input.boundaryAudit.intakeStageRunning &&
    !input.boundaryAudit.intakeStagePassed;

  const stage2StillRunning = input.boundaryAudit.intakeStageRunning;

  let failureClass = input.completionDetection.failureClass;
  let reason = input.completionDetection.reason;

  if (propagationStoppedAfterArtifactsBuilt && failureClass === 'NONE') {
    failureClass = 'PROPAGATION_FAILURE';
    reason = 'Propagation stopped after launch-readiness-artifacts-built';
  } else if (completionEventDropped && failureClass === 'NONE') {
    failureClass = 'COMPLETION_EVENT_DROPPED';
    reason = 'Intake completion conditions met but completion event dropped';
  } else if (stage2StillRunning && input.boundaryAudit.rule1Satisfied && failureClass === 'NONE') {
    failureClass = 'STATE_TRANSITION_STALLED';
    reason = 'Stage 2 RUNNING after launch readiness artifacts built';
  }

  return {
    readOnly: true,
    propagationStoppedAfterArtifactsBuilt,
    intakePassNotPropagated,
    completionEventDropped,
    stage2StillRunning,
    failureClass,
    reason,
  };
}
