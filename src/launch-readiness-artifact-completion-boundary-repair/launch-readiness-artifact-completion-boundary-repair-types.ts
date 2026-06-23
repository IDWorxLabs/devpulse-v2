/**
 * Phase 27.03 — Launch Readiness Artifact Completion Boundary Repair types (V1).
 */

import type { FounderTestRuntimeSnapshot } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type { FounderTestLaunchReadinessReport } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';

export type LaunchReadinessArtifactBoundaryFailureClass =
  | 'REPORT_GENERATION_CRASH'
  | 'ARTIFACT_BUILD_FAILED'
  | 'ARTIFACT_PERSIST_FAILED'
  | 'ARTIFACT_COMPLETION_NOT_EMITTED'
  | 'COMPLETION_EVENT_DROPPED'
  | 'INTAKE_COMPLETION_NOT_PROPAGATED'
  | 'STATE_MACHINE_STALLED'
  | 'UNKNOWN_ARTIFACT_BOUNDARY_FAILURE'
  | 'NONE';

export type LaunchReadinessArtifactChainStepId =
  | 'assessment-complete'
  | 'report-markdown-started'
  | 'report-markdown-finished'
  | 'launch-artifacts-created'
  | 'launch-artifacts-persisted'
  | 'artifacts-built-emitted'
  | 'intake-validation-complete-emitted'
  | 'planning-gate-started';

export interface LaunchReadinessAssessmentAudit {
  readOnly: true;
  assessmentFinished: boolean;
  assessmentPassed: boolean;
  assessmentWithWarnings: boolean;
  stoppingReason: string | null;
}

export interface LaunchReadinessArtifactBuilderAudit {
  readOnly: true;
  reportMarkdownStarted: boolean;
  reportMarkdownFinished: boolean;
  launchArtifactsCreated: boolean;
  launchArtifactsPersisted: boolean;
  artifactsBuiltEmitted: boolean;
  activeArtifactSubstepOperationId: string | null;
  activeArtifactSubstepLabel: string | null;
  reportMarkdownPresent: boolean;
  stoppingReason: string | null;
}

export interface LaunchReadinessBoundaryDetection {
  readOnly: true;
  exactStoppingStep: LaunchReadinessArtifactChainStepId | null;
  missingCompletionBoundary: string | null;
  failureClass: LaunchReadinessArtifactBoundaryFailureClass;
  reason: string | null;
}

export interface LaunchReadinessTransitionAnalysis {
  readOnly: true;
  intakeValidationRunning: boolean;
  intakeValidationCompleteEmitted: boolean;
  planningGateStarted: boolean;
  stageAdvancementBlocked: boolean;
  completionEventDropped: boolean;
  failureClass: LaunchReadinessArtifactBoundaryFailureClass;
  reason: string | null;
}

export interface LaunchReadinessArtifactBoundaryRepairPlan {
  readOnly: true;
  repairRequired: boolean;
  actions: readonly string[];
  failureClass: LaunchReadinessArtifactBoundaryFailureClass;
  emitReportMarkdownPassed: boolean;
  emitArtifactsBuilt: boolean;
  writeDegradedReportMarkdown: boolean;
  clearActiveArtifactSubstep: boolean;
  recordArtifactsBuiltBoundary: boolean;
  reason: string | null;
}

export interface LaunchReadinessArtifactCompletionBoundaryRepairReport {
  readOnly: true;
  repairId: string;
  generatedAt: string;
  assessmentAudit: LaunchReadinessAssessmentAudit;
  artifactBuilderAudit: LaunchReadinessArtifactBuilderAudit;
  boundaryDetection: LaunchReadinessBoundaryDetection;
  transitionAnalysis: LaunchReadinessTransitionAnalysis;
  repairPlan: LaunchReadinessArtifactBoundaryRepairPlan;
  repairApplied: boolean;
  passToken: string | null;
}

export interface LaunchReadinessArtifactCompletionBoundaryRepairAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: LaunchReadinessArtifactCompletionBoundaryRepairReport;
}

export interface AssessLaunchReadinessArtifactCompletionBoundaryRepairInput {
  rootDir?: string;
  runtimeSnapshot?: Pick<
    FounderTestRuntimeSnapshot,
    | 'state'
    | 'stages'
    | 'traceEvents'
    | 'missingCompletionBoundary'
    | 'stage2CompletionGap'
    | 'activeArtifactBuildSubstep'
    | 'activeArtifactBuildSubstepOperationId'
  > | null;
  launchReadinessReportMarkdown?: string | null;
  launchReadinessReport?: FounderTestLaunchReadinessReport | null;
  artifactPersisted?: boolean;
  nowMs?: number;
}

export interface ApplyLaunchReadinessArtifactCompletionBoundaryRepairSyncInput {
  launchReadinessReport: FounderTestLaunchReadinessReport;
  degraded?: boolean;
  degradedDetail?: string | null;
  onBuildTrace?: (event: {
    operationId: string;
    operationLabel: string;
    phase: 'RUNNING' | 'PASSED' | 'FAILED' | 'SLOW' | 'STALLED' | 'BUDGET_EXCEEDED';
    errorMessage?: string;
  }) => void;
  buildMarkdown?: () => string;
  nowMs?: number;
}

export interface LaunchReadinessArtifactChainResult {
  readOnly: true;
  markdown: string;
  reportMarkdownDegraded: boolean;
  artifactsBuiltEmitted: boolean;
  repairApplied: boolean;
  failureClass: LaunchReadinessArtifactBoundaryFailureClass;
}
