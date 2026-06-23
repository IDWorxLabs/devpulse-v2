/**
 * Phase 26.98 — Launch Readiness Artifact Completion Barrier Repair types (V1).
 */

import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type { ActiveArtifactBuildSubstep } from '../founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.js';

export type LaunchArtifactCompletionFailureClass =
  | 'CHAT_SETTLED_BUT_ARTIFACT_ACTIVE'
  | 'PRODUCT_READINESS_BUDGET_RESULT_DROPPED'
  | 'DEGRADED_RESULT_NOT_PROPAGATED'
  | 'LAUNCH_READINESS_COMPLETION_NOT_EMITTED'
  | 'ARTIFACT_SUBSTEP_NOT_CLEARED'
  | 'INTAKE_COMPLETION_BLOCKED_BY_DEGRADED_RESULT'
  | 'DIAGNOSTIC_ARTIFACT_NOT_STORED'
  | 'UNKNOWN_LAUNCH_ARTIFACT_COMPLETION_FAILURE'
  | 'NONE';

export interface LaunchArtifactStepAudit {
  readOnly: true;
  chatStressStarted: number;
  chatStressSettled: number;
  chatStressPending: number;
  rule1Satisfied: boolean;
  activeArtifactSubstep: ActiveArtifactBuildSubstep | null;
  chatSettledButArtifactActive: boolean;
  reason: string | null;
}

export interface ProductReadinessBudgetResultDetection {
  readOnly: true;
  budgetExceeded: boolean;
  simulationDegradedPartial: boolean;
  productReadinessCompletePropagated: boolean;
  productReadinessSimulationCompleteTraced: boolean;
  budgetResultDropped: boolean;
  failureClass: LaunchArtifactCompletionFailureClass;
  reason: string | null;
}

export interface LaunchReadinessCompletionDetection {
  readOnly: true;
  launchReadinessAssessmentCompleteEmitted: boolean;
  launchReadinessAssessmentCompleteWithWarningsEmitted: boolean;
  launchReadinessArtifactsBuiltEmitted: boolean;
  launchReadinessReportMarkdownPresent: boolean;
  failureClass: LaunchArtifactCompletionFailureClass;
  reason: string | null;
}

export interface LaunchArtifactTransitionAnalysis {
  readOnly: true;
  intakeValidationRunning: boolean;
  intakePassWithWarningsEligible: boolean;
  missingCompletionBoundary: string | null;
  activeArtifactSubstepLabel: string | null;
  stageAdvancementBlocked: boolean;
  failureClass: LaunchArtifactCompletionFailureClass;
  reason: string | null;
}

export interface LaunchArtifactCompletionRepairPlan {
  readOnly: true;
  repairRequired: boolean;
  actions: readonly string[];
  failureClass: LaunchArtifactCompletionFailureClass;
  clearChatStressArtifactSubstep: boolean;
  forceProductReadinessCompletion: boolean;
  emitLaunchReadinessAssessmentComplete: boolean;
  emitLaunchReadinessAssessmentCompleteWithWarnings: boolean;
  writeDegradedDiagnosticMarkdown: boolean;
  recordIntakePassWithWarnings: boolean;
  reason: string | null;
}

export interface LaunchReadinessArtifactCompletionBarrierRepairReport {
  readOnly: true;
  repairId: string;
  generatedAt: string;
  stepAudit: LaunchArtifactStepAudit;
  budgetResultDetection: ProductReadinessBudgetResultDetection;
  completionDetection: LaunchReadinessCompletionDetection;
  transitionAnalysis: LaunchArtifactTransitionAnalysis;
  repairPlan: LaunchArtifactCompletionRepairPlan;
  repairApplied: boolean;
  passToken: string | null;
}

export interface LaunchReadinessArtifactCompletionBarrierRepairAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: LaunchReadinessArtifactCompletionBarrierRepairReport;
}

export interface AssessLaunchReadinessArtifactCompletionBarrierRepairInput {
  rootDir?: string;
  runtimeSnapshot?: Pick<
    FounderTestRuntimeSnapshot,
    | 'state'
    | 'stages'
    | 'traceEvents'
    | 'missingCompletionBoundary'
    | 'stage2CompletionGap'
    | 'activeArtifactBuildSubstep'
    | 'chatStressStartedCount'
    | 'chatStressSettledCount'
    | 'chatStressPendingCount'
  > | null;
  simulationRuntimeHealth?: string | null;
  productReadinessDegraded?: boolean;
  launchReadinessReportMarkdown?: string | null;
  nowMs?: number;
}

export interface ApplyLaunchReadinessArtifactCompletionBarrierRepairInput {
  rootDir?: string;
  onBuildTrace?: (event: {
    operationId: string;
    operationLabel: string;
    phase: 'RUNNING' | 'PASSED' | 'FAILED' | 'SLOW' | 'STALLED' | 'BUDGET_EXCEEDED';
    errorMessage?: string;
  }) => void;
  onRuntimeTrace?: (event: {
    operationId: string;
    operationLabel: string;
    stageId: string;
    status: 'PASSED' | 'RUNNING';
  }) => void;
  simulationRuntimeHealth?: string | null;
  productReadinessDegraded?: boolean;
  launchReadinessReportMarkdown?: string | null;
  nowMs?: number;
}
