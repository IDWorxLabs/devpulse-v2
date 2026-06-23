/**
 * Phase 27.05 — Intake Validation Stage Transition Repair authority (V1).
 */

import { createHash } from 'node:crypto';
import {
  recordIntakeCompletionBoundaryOperation,
  recordIntakeValidationCompleteEmitted,
  recordPlanningGateStarted,
  hasIntakeValidationCompletePropagated,
} from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { auditIntakeValidationBoundary } from './intake-validation-boundary-auditor.js';
import { detectIntakeValidationCompletion } from './intake-validation-completion-detector.js';
import { analyzeStageTransitionPropagation } from './stage-transition-propagation-analyzer.js';
import { analyzePlanningGateEligibility } from './planning-gate-eligibility-analyzer.js';
import { planIntakeValidationStageTransitionRepair } from './intake-validation-repair-planner.js';
import { recordIntakeValidationStageTransitionRepair } from './intake-validation-stage-transition-history.js';
import {
  INTAKE_VALIDATION_COMPLETE,
  INTAKE_VALIDATION_COMPLETE_EMITTED,
  INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_CACHE_KEY_PREFIX,
  INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS,
  PLANNING_GATE_ENTERED,
  PLANNING_GATE_STARTED,
} from './intake-validation-stage-transition-repair-registry.js';
import type {
  AssessIntakeValidationStageTransitionRepairInput,
  IntakeValidationStageTransitionRepairAssessment,
  ReconcileIntakeValidationStageTransitionHandlers,
} from './intake-validation-stage-transition-repair-types.js';

let repairCounter = 0;
let intakeValidationCompleteRepairEmitted = false;

export function resetIntakeValidationStageTransitionRepairCounterForTests(): void {
  repairCounter = 0;
  intakeValidationCompleteRepairEmitted = false;
}

export function resetIntakeValidationStageTransitionRepairModuleForTests(): void {
  resetIntakeValidationStageTransitionRepairCounterForTests();
}

function nextRepairId(): string {
  repairCounter += 1;
  return `intake-validation-stage-transition-repair-${repairCounter}-${Date.now()}`;
}

function stableCacheKey(repairId: string, repairApplied: boolean): string {
  const digest = createHash('sha256')
    .update(
      [INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS, repairId, String(repairApplied)].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_CACHE_KEY_PREFIX}:${digest}`;
}

export function hasIntakeValidationCompleteRepairEmitted(): boolean {
  return intakeValidationCompleteRepairEmitted || hasIntakeValidationCompletePropagated();
}

export function assessIntakeValidationStageTransitionRepair(
  input: AssessIntakeValidationStageTransitionRepairInput = {},
): IntakeValidationStageTransitionRepairAssessment {
  const nowMs = input.nowMs ?? Date.now();
  const repairId = nextRepairId();
  const boundaryAudit = auditIntakeValidationBoundary({ runtimeSnapshot: input.runtimeSnapshot });
  const completionDetection = detectIntakeValidationCompletion(boundaryAudit);
  const propagationAnalysis = analyzeStageTransitionPropagation({
    runtimeSnapshot: input.runtimeSnapshot,
    boundaryAudit,
    completionDetection,
  });
  const planningGateAnalysis = analyzePlanningGateEligibility({
    runtimeSnapshot: input.runtimeSnapshot,
    boundaryAudit,
    completionDetection,
  });
  const repairPlan = planIntakeValidationStageTransitionRepair({
    boundaryAudit,
    completionDetection,
    propagationAnalysis,
    planningGateAnalysis,
  });

  const chainSatisfied =
    boundaryAudit.rule1Satisfied &&
    (boundaryAudit.intakeValidationCompleteEmitted || hasIntakeValidationCompleteRepairEmitted()) &&
    boundaryAudit.intakeStagePassed &&
    !repairPlan.repairRequired;

  const report = {
    readOnly: true as const,
    repairId,
    generatedAt: new Date(nowMs).toISOString(),
    boundaryAudit,
    completionDetection,
    propagationAnalysis,
    planningGateAnalysis,
    repairPlan,
    repairApplied: false,
    passToken: chainSatisfied ? INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS : null,
  };

  recordIntakeValidationStageTransitionRepair(report);
  stableCacheKey(repairId, false);

  return {
    readOnly: true,
    advisoryOnly: true,
    report,
  };
}

export function emitIntakeValidationCompleteOnce(
  handlers: ReconcileIntakeValidationStageTransitionHandlers = {},
): boolean {
  if (hasIntakeValidationCompleteRepairEmitted()) {
    return false;
  }

  handlers.onRuntimeTrace?.({
    operationId: INTAKE_VALIDATION_COMPLETE,
    operationLabel: 'Intake validation complete',
    stageId: 'INTAKE_VALIDATION',
    status: 'PASSED',
  });

  recordIntakeCompletionBoundaryOperation(INTAKE_VALIDATION_COMPLETE);
  recordIntakeValidationCompleteEmitted();
  intakeValidationCompleteRepairEmitted = true;

  handlers.onRuntimeTrace?.({
    operationId: INTAKE_VALIDATION_COMPLETE_EMITTED,
    operationLabel: 'Intake validation complete emitted',
    stageId: 'INTAKE_VALIDATION',
    status: 'PASSED',
  });

  return true;
}

export function emitPlanningGateRunningOnce(
  handlers: ReconcileIntakeValidationStageTransitionHandlers = {},
): boolean {
  handlers.onRuntimeTrace?.({
    operationId: PLANNING_GATE_ENTERED,
    operationLabel: 'Planning gate entered',
    stageId: 'PLANNING_GATE',
    status: 'RUNNING',
  });

  handlers.onRuntimeTrace?.({
    operationId: PLANNING_GATE_STARTED,
    operationLabel: 'Planning gate started',
    stageId: 'PLANNING_GATE',
    status: 'PASSED',
  });

  recordPlanningGateStarted();
  handlers.onAdvancePlanningGate?.();
  return true;
}

export function reconcileIntakeValidationStageTransitionOnSnapshot(
  runtimeSnapshot: AssessIntakeValidationStageTransitionRepairInput['runtimeSnapshot'],
  handlers: ReconcileIntakeValidationStageTransitionHandlers = {},
): IntakeValidationStageTransitionRepairAssessment {
  const assessment = assessIntakeValidationStageTransitionRepair({ runtimeSnapshot });

  if (!assessment.report.repairPlan.repairRequired) {
    return assessment;
  }

  const { repairPlan } = assessment.report;

  if (repairPlan.emitIntakeValidationComplete) {
    emitIntakeValidationCompleteOnce(handlers);
  }

  if (repairPlan.completeIntakeValidationStage) {
    handlers.onCompleteIntakeStage?.();
  }

  if (repairPlan.emitPlanningGateRunning) {
    emitPlanningGateRunningOnce(handlers);
  }

  const refreshed = assessIntakeValidationStageTransitionRepair({ runtimeSnapshot });
  const pass =
    refreshed.report.boundaryAudit.rule1Satisfied &&
    (refreshed.report.boundaryAudit.intakeValidationCompleteEmitted ||
      hasIntakeValidationCompleteRepairEmitted());

  const repairedReport = {
    ...refreshed.report,
    repairApplied: true,
    passToken: pass ? INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS : null,
  };

  recordIntakeValidationStageTransitionRepair(repairedReport);
  stableCacheKey(repairedReport.repairId, true);

  return {
    readOnly: true,
    advisoryOnly: true,
    report: repairedReport,
  };
}

export function applyIntakeValidationStageTransitionRepairSync(
  handlers: ReconcileIntakeValidationStageTransitionHandlers = {},
): IntakeValidationStageTransitionRepairAssessment {
  return reconcileIntakeValidationStageTransitionOnSnapshot(null, handlers);
}
