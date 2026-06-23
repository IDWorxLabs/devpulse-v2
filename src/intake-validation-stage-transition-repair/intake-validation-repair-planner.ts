/**
 * Phase 27.05 — Intake validation stage transition repair planner (V1).
 */

import type {
  IntakeValidationStageTransitionRepairPlan,
  IntakeValidationBoundaryAudit,
  IntakeValidationCompletionDetection,
  PlanningGateEligibilityAnalysis,
  StageTransitionPropagationAnalysis,
} from './intake-validation-stage-transition-repair-types.js';
import {
  INTAKE_VALIDATION_COMPLETE,
  PLANNING_GATE_ENTERED,
  PLANNING_GATE_STARTED,
} from './intake-validation-stage-transition-repair-registry.js';

export function planIntakeValidationStageTransitionRepair(input: {
  boundaryAudit: IntakeValidationBoundaryAudit;
  completionDetection: IntakeValidationCompletionDetection;
  propagationAnalysis: StageTransitionPropagationAnalysis;
  planningGateAnalysis: PlanningGateEligibilityAnalysis;
}): IntakeValidationStageTransitionRepairPlan {
  const actions: string[] = [];

  if (!input.boundaryAudit.rule1Satisfied) {
    return {
      readOnly: true,
      repairRequired: false,
      actions: ['await-launch-readiness-artifact-chain'],
      emitIntakeValidationComplete: false,
      completeIntakeValidationStage: false,
      advancePlanningGate: false,
      emitPlanningGateRunning: false,
      failureClass: input.propagationAnalysis.failureClass,
      reason: input.boundaryAudit.reason,
    };
  }

  const emitIntakeValidationComplete = input.completionDetection.shouldEmitIntakeComplete;
  const completeIntakeValidationStage =
    emitIntakeValidationComplete ||
    (input.boundaryAudit.rule1Satisfied && input.boundaryAudit.intakeStageRunning);
  const advancePlanningGate =
    completeIntakeValidationStage && !input.planningGateAnalysis.planningGateRunning;
  const emitPlanningGateRunning =
    completeIntakeValidationStage && !input.planningGateAnalysis.planningGateStarted;

  if (emitIntakeValidationComplete) {
    actions.push(`emit-${INTAKE_VALIDATION_COMPLETE}`);
    actions.push(`emit-${INTAKE_VALIDATION_COMPLETE}-emitted`);
  }
  if (completeIntakeValidationStage) {
    actions.push('complete-intake-validation-stage');
  }
  if (emitPlanningGateRunning) {
    actions.push(`emit-${PLANNING_GATE_ENTERED}`);
    actions.push(`emit-${PLANNING_GATE_STARTED}`);
  }
  if (advancePlanningGate) {
    actions.push('advance-planning-gate-stage');
  }

  const repairRequired =
    emitIntakeValidationComplete ||
    completeIntakeValidationStage ||
    emitPlanningGateRunning ||
    advancePlanningGate;

  const failureClass =
    input.propagationAnalysis.failureClass !== 'NONE'
      ? input.propagationAnalysis.failureClass
      : input.planningGateAnalysis.failureClass !== 'NONE'
        ? input.planningGateAnalysis.failureClass
        : input.completionDetection.failureClass;

  return {
    readOnly: true,
    repairRequired,
    actions,
    emitIntakeValidationComplete,
    completeIntakeValidationStage,
    advancePlanningGate,
    emitPlanningGateRunning,
    failureClass,
    reason:
      input.propagationAnalysis.reason ??
      input.planningGateAnalysis.reason ??
      input.completionDetection.reason,
  };
}
