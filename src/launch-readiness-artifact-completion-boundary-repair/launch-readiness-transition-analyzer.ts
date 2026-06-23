/**
 * Phase 27.03 — Launch readiness transition analyzer (V1).
 */

import { hasIntakeValidationCompletionBoundaryInRegistry } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type {
  LaunchReadinessArtifactBuilderAudit,
  LaunchReadinessAssessmentAudit,
  LaunchReadinessBoundaryDetection,
  LaunchReadinessTransitionAnalysis,
} from './launch-readiness-artifact-completion-boundary-repair-types.js';
import {
  INTAKE_VALIDATION_COMPLETE,
  PLANNING_GATE_ENTERED,
  PLANNING_GATE_STARTED,
} from './launch-readiness-artifact-completion-boundary-repair-registry.js';

function hasPassedTrace(
  traceEvents: FounderTestRuntimeSnapshot['traceEvents'],
  operationId: string,
): boolean {
  if (hasIntakeValidationCompletionBoundaryInRegistry(operationId)) {
    return true;
  }
  return traceEvents.some((event) => event.operationId === operationId && event.status === 'PASSED');
}

function hasRunningTrace(
  traceEvents: FounderTestRuntimeSnapshot['traceEvents'],
  operationId: string,
): boolean {
  return traceEvents.some((event) => event.operationId === operationId && event.status === 'RUNNING');
}

export function analyzeLaunchReadinessTransition(input: {
  runtimeSnapshot?: Pick<
    FounderTestRuntimeSnapshot,
    'state' | 'stages' | 'traceEvents' | 'missingCompletionBoundary'
  > | null;
  assessmentAudit: LaunchReadinessAssessmentAudit;
  artifactBuilderAudit: LaunchReadinessArtifactBuilderAudit;
  boundaryDetection: LaunchReadinessBoundaryDetection;
}): LaunchReadinessTransitionAnalysis {
  const traceEvents = input.runtimeSnapshot?.traceEvents ?? [];
  const intakeStage = input.runtimeSnapshot?.stages.find((stage) => stage.stageId === 'INTAKE_VALIDATION');
  const intakeValidationRunning =
    intakeStage?.status === 'RUNNING' ||
    input.runtimeSnapshot?.state === 'RUNNING' ||
    hasRunningTrace(traceEvents, 'intake-validation-started');
  const intakeValidationCompleteEmitted = hasPassedTrace(traceEvents, INTAKE_VALIDATION_COMPLETE);
  const planningGateStarted =
    hasRunningTrace(traceEvents, PLANNING_GATE_ENTERED) ||
    hasRunningTrace(traceEvents, PLANNING_GATE_STARTED) ||
    hasPassedTrace(traceEvents, PLANNING_GATE_ENTERED) ||
    hasPassedTrace(traceEvents, PLANNING_GATE_STARTED);

  const assessmentCompleteButArtifactsMissing =
    input.assessmentAudit.assessmentFinished && !input.artifactBuilderAudit.artifactsBuiltEmitted;

  const completionEventDropped =
    input.artifactBuilderAudit.artifactsBuiltEmitted &&
    !intakeValidationCompleteEmitted &&
    intakeValidationRunning;

  const stageAdvancementBlocked =
    input.boundaryDetection.failureClass !== 'NONE' ||
    assessmentCompleteButArtifactsMissing ||
    completionEventDropped;

  let failureClass = input.boundaryDetection.failureClass;
  let reason = input.boundaryDetection.reason;

  if (completionEventDropped && failureClass === 'NONE') {
    failureClass = 'COMPLETION_EVENT_DROPPED';
    reason = 'Launch readiness artifacts built emitted but intake-validation-complete missing';
  } else if (
    assessmentCompleteButArtifactsMissing &&
    failureClass === 'NONE'
  ) {
    failureClass = 'ARTIFACT_COMPLETION_NOT_EMITTED';
    reason = 'Assessment complete without launch-readiness-artifacts-built';
  }

  return {
    readOnly: true,
    intakeValidationRunning,
    intakeValidationCompleteEmitted,
    planningGateStarted,
    stageAdvancementBlocked,
    completionEventDropped,
    failureClass,
    reason,
  };
}
