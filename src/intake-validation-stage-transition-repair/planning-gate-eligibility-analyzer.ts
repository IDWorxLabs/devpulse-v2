/**
 * Phase 27.05 — Planning gate eligibility analyzer (V1).
 */

import { hasPlanningGateStartedPropagated } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { hasPassedTraceEvent } from '../founder-test-runtime-monitor/stage2-completion-tracker.js';
import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type {
  IntakeValidationBoundaryAudit,
  IntakeValidationCompletionDetection,
  PlanningGateEligibilityAnalysis,
} from './intake-validation-stage-transition-repair-types.js';
import {
  INTAKE_VALIDATION_COMPLETE,
  PLANNING_GATE_ENTERED,
  PLANNING_GATE_STARTED,
} from './intake-validation-stage-transition-repair-registry.js';

export function analyzePlanningGateEligibility(input: {
  runtimeSnapshot?: Pick<FounderTestRuntimeSnapshot, 'stages' | 'traceEvents'> | null;
  boundaryAudit: IntakeValidationBoundaryAudit;
  completionDetection: IntakeValidationCompletionDetection;
}): PlanningGateEligibilityAnalysis {
  const traceEvents = input.runtimeSnapshot?.traceEvents ?? [];
  const planningGateStage = input.runtimeSnapshot?.stages.find((stage) => stage.stageId === 'PLANNING_GATE');
  const intakeCompleteEmitted = hasPassedTraceEvent(traceEvents, INTAKE_VALIDATION_COMPLETE);
  const planningGateStartedTrace =
    hasPassedTraceEvent(traceEvents, PLANNING_GATE_STARTED) ||
    hasPassedTraceEvent(traceEvents, PLANNING_GATE_ENTERED);
  const planningGateStartedPropagated = hasPlanningGateStartedPropagated();

  const planningGateEligible =
    input.completionDetection.intakeValidationComplete ||
    intakeCompleteEmitted ||
    input.boundaryAudit.intakeStagePassed;

  const planningGateRunning =
    planningGateStage?.status === 'RUNNING' ||
    hasPassedTraceEvent(traceEvents, PLANNING_GATE_ENTERED);

  const planningGateStarted =
    planningGateStartedTrace || planningGateStartedPropagated || planningGateStage?.status === 'PASSED';

  let failureClass = 'NONE' as PlanningGateEligibilityAnalysis['failureClass'];
  let reason: string | null = null;

  if (planningGateEligible && !planningGateStarted && input.boundaryAudit.intakeStageRunning) {
    failureClass = 'PLANNING_GATE_NOT_STARTED';
    reason = 'Planning gate eligible but PLANNING_GATE_RUNNING not emitted';
  } else if (
    planningGateEligible &&
    !planningGateRunning &&
    !planningGateStarted &&
    input.boundaryAudit.rule1Satisfied
  ) {
    failureClass = 'PLANNING_GATE_NOT_ELIGIBLE';
    reason = 'Intake complete but planning gate not eligible';
  }

  return {
    readOnly: true,
    planningGateEligible,
    planningGateStarted,
    planningGateRunning,
    failureClass,
    reason,
  };
}
