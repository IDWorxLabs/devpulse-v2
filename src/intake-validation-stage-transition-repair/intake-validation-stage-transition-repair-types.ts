/**
 * Phase 27.05 — Intake Validation Stage Transition Repair types (V1).
 */

import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';

export type IntakeValidationStageTransitionFailureClass =
  | 'INTAKE_COMPLETION_NOT_DETECTED'
  | 'INTAKE_COMPLETION_NOT_EMITTED'
  | 'INTAKE_PASS_NOT_PROPAGATED'
  | 'PLANNING_GATE_NOT_ELIGIBLE'
  | 'PLANNING_GATE_NOT_STARTED'
  | 'COMPLETION_EVENT_DROPPED'
  | 'STATE_TRANSITION_STALLED'
  | 'PROPAGATION_FAILURE'
  | 'UNKNOWN_STAGE_TRANSITION_FAILURE'
  | 'NONE';

export interface IntakeValidationBoundaryAudit {
  readOnly: true;
  launchReadinessAssessmentComplete: boolean;
  launchReadinessReportBuilt: boolean;
  launchReadinessArtifactsBuilt: boolean;
  intakeValidationComplete: boolean;
  intakeValidationCompleteEmitted: boolean;
  intakeStageRunning: boolean;
  intakeStagePassed: boolean;
  rule1Satisfied: boolean;
  reason: string | null;
}

export interface IntakeValidationCompletionDetection {
  readOnly: true;
  intakeValidationComplete: boolean;
  shouldEmitIntakeComplete: boolean;
  failureClass: IntakeValidationStageTransitionFailureClass;
  reason: string | null;
}

export interface StageTransitionPropagationAnalysis {
  readOnly: true;
  propagationStoppedAfterArtifactsBuilt: boolean;
  intakePassNotPropagated: boolean;
  completionEventDropped: boolean;
  stage2StillRunning: boolean;
  failureClass: IntakeValidationStageTransitionFailureClass;
  reason: string | null;
}

export interface PlanningGateEligibilityAnalysis {
  readOnly: true;
  planningGateEligible: boolean;
  planningGateStarted: boolean;
  planningGateRunning: boolean;
  failureClass: IntakeValidationStageTransitionFailureClass;
  reason: string | null;
}

export interface IntakeValidationStageTransitionRepairPlan {
  readOnly: true;
  repairRequired: boolean;
  actions: readonly string[];
  emitIntakeValidationComplete: boolean;
  completeIntakeValidationStage: boolean;
  advancePlanningGate: boolean;
  emitPlanningGateRunning: boolean;
  failureClass: IntakeValidationStageTransitionFailureClass;
  reason: string | null;
}

export interface IntakeValidationStageTransitionRepairReport {
  readOnly: true;
  repairId: string;
  generatedAt: string;
  boundaryAudit: IntakeValidationBoundaryAudit;
  completionDetection: IntakeValidationCompletionDetection;
  propagationAnalysis: StageTransitionPropagationAnalysis;
  planningGateAnalysis: PlanningGateEligibilityAnalysis;
  repairPlan: IntakeValidationStageTransitionRepairPlan;
  repairApplied: boolean;
  passToken: string | null;
}

export interface IntakeValidationStageTransitionRepairAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: IntakeValidationStageTransitionRepairReport;
}

export interface AssessIntakeValidationStageTransitionRepairInput {
  runtimeSnapshot?: Pick<
    FounderTestRuntimeSnapshot,
    'state' | 'stages' | 'traceEvents' | 'missingCompletionBoundary' | 'stage2CompletionGap'
  > | null;
  nowMs?: number;
}

export interface ReconcileIntakeValidationStageTransitionHandlers {
  onRuntimeTrace?: (event: {
    operationId: string;
    operationLabel: string;
    stageId: string;
    status: 'PASSED' | 'RUNNING';
  }) => void;
  onCompleteIntakeStage?: () => void;
  onAdvancePlanningGate?: () => void;
}
