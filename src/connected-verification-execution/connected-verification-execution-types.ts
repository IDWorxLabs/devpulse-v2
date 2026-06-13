/**
 * Connected Verification Execution — core models.
 * Real bounded verification inside disposable workspaces only.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ConnectedLivePreviewExecutionAssessment } from '../connected-live-preview-execution/connected-live-preview-execution-types.js';
import type { ConnectedRuntimeExecutionAssessment } from '../connected-runtime-execution/connected-runtime-execution-types.js';
import type { ConnectedVerificationAssessment } from '../connected-verification-foundation/connected-verification-types.js';
import type { ConnectedWorkspaceCreationAssessment } from '../connected-workspace-creation/connected-workspace-creation-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import type { ExecutionVerificationReport } from '../execution-verification/types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { VerificationRealityAssessment } from '../verification-reality/verification-reality-types.js';
import type { World2DryRunExecutionVerificationAssessment } from '../world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-types.js';

export type VerificationExecutionState =
  | 'VERIFICATION_EXECUTED'
  | 'VERIFICATION_EXECUTED_WITH_WARNINGS'
  | 'VERIFICATION_EXECUTION_FAILED'
  | 'VERIFICATION_EXECUTION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type VerificationExecutionMode = 'REAL_VERIFICATION' | 'DRY_RUN' | 'BLOCKED';

export type VerificationCheckStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface VerificationResultEntry {
  readOnly: true;
  checkId: string;
  label: string;
  status: VerificationCheckStatus;
  detail: string;
  source: string;
}

export interface VerificationArtifactEntry {
  readOnly: true;
  path: string;
  category: string;
  sourceAuthority: string;
}

export interface VerificationEvidenceEntry {
  readOnly: true;
  evidenceId: string;
  evidenceType: string;
  summary: string;
  source: string;
  inspectedAt: string;
}

export interface VerificationDiagnosticEntry {
  readOnly: true;
  diagnosticId: string;
  label: string;
  value: string;
  source: string;
}

export interface VerificationExecutionEvidence {
  readOnly: true;
  verificationStarted: boolean;
  verificationCompleted: boolean;
  verificationChecksExecuted: number;
  verificationArtifactsGenerated: boolean;
  verificationCoverageCollected: boolean;
  verificationSucceeded: boolean;
  previewProbeStatus: VerificationCheckStatus;
  workspaceEvidenceStatus: VerificationCheckStatus;
  runtimeEvidenceStatus: VerificationCheckStatus;
  previewEvidenceStatus: VerificationCheckStatus;
  inspectedAt: string;
  inspectionSource: 'real-verification-execution-inspection';
}

export interface VerificationExecutionContract {
  readOnly: true;
  verificationId: string;
  workspaceId: string;
  previewUrl: string;
  verificationPlan: string[];
  verificationDurationMs: number;
  verificationResults: VerificationResultEntry[];
  verificationArtifacts: VerificationArtifactEntry[];
  verificationEvidence: VerificationEvidenceEntry[];
  verificationWarnings: string[];
  verificationDiagnostics: VerificationDiagnosticEntry[];
  executionEvidence: VerificationExecutionEvidence;
  realVerificationExecutionPerformed: boolean;
  world1Protected: true;
  disposableOnly: true;
}

export interface VerificationExecutionQuestionAnswers {
  verificationExecuted: boolean;
  checksActuallyRun: boolean;
  resultsCollected: boolean;
  verificationArtifactsGenerated: boolean;
  executionIsolated: boolean;
  world1Protected: boolean;
  verificationAuditable: boolean;
  founderInspectable: boolean;
  verificationReadinessProven: boolean;
  verificationExecutionProven: boolean;
}

export interface ConnectedVerificationExecutionInputSnapshot {
  readOnly: true;
  connectedLivePreviewExecutionAssessment: ConnectedLivePreviewExecutionAssessment;
  connectedRuntimeExecutionAssessment: ConnectedRuntimeExecutionAssessment;
  connectedWorkspaceCreationAssessment: ConnectedWorkspaceCreationAssessment | null;
  connectedBuildExecutionFoundationAssessment: ConnectedBuildExecutionAssessment | null;
  connectedVerificationFoundationAssessment: ConnectedVerificationAssessment;
  verificationRealityAssessment: VerificationRealityAssessment;
  dryRunVerifierAssessment: World2DryRunExecutionVerificationAssessment;
  executionVerificationReport: ExecutionVerificationReport;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
  missingAuthorities: string[];
}

export interface ConnectedVerificationExecutionReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  executionId: string;
  generatedAt: string;
  verificationScore: number;
  verificationState: VerificationExecutionState;
  verificationCoverage: number;
  previewProbeResult: VerificationCheckStatus;
  workspaceEvidenceResult: VerificationCheckStatus;
  runtimeEvidenceResult: VerificationCheckStatus;
  previewEvidenceResult: VerificationCheckStatus;
  verificationDurationMs: number;
  executionContract: VerificationExecutionContract | null;
  blockingStages: string[];
  warningStages: string[];
  recommendedNextActions: string[];
  questionAnswers: VerificationExecutionQuestionAnswers;
  inputSnapshot: ConnectedVerificationExecutionInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface ConnectedVerificationExecutionAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'VERIFICATION_EXECUTION_COMPLETE' | 'VERIFICATION_EXECUTION_FAILED';
  report: ConnectedVerificationExecutionReport;
}

export interface AssessConnectedVerificationExecutionInput {
  rootDir?: string;
  connectedLivePreviewExecutionAssessment?: ConnectedLivePreviewExecutionAssessment;
  connectedRuntimeExecutionAssessment?: ConnectedRuntimeExecutionAssessment;
  connectedWorkspaceCreationAssessment?: ConnectedWorkspaceCreationAssessment;
  connectedBuildExecutionFoundationAssessment?: ConnectedBuildExecutionAssessment;
  connectedVerificationFoundationAssessment?: ConnectedVerificationAssessment;
  executionProofAssessment?: ExecutionProofAssessment | null;
  founderAcceptanceAssessment?: FounderAcceptanceAssessment | null;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment;
  performRealVerification?: boolean;
}

export interface ConnectedVerificationExecutionHistoryEntry {
  timestamp: string;
  executionId: string;
  verificationScore: number;
  verificationState: VerificationExecutionState;
  workspaceId: string;
  checksExecuted: number;
  realVerificationExecutionPerformed: boolean;
  blockerCount: number;
  warningCount: number;
}

export interface ConnectedVerificationExecutionHistorySummary {
  totalAssessments: number;
  executedVerifications: number;
  executedWithWarningsVerifications: number;
  failedExecutions: number;
  blockedExecutions: number;
  insufficientEvidenceExecutions: number;
}

export interface ConnectedVerificationExecutionArtifacts {
  connectedVerificationExecutionAssessment: ConnectedVerificationExecutionAssessment;
  connectedVerificationExecutionReportMarkdown: string;
}

export interface ExecuteVerificationExecutionInput {
  projectRootDir: string;
  workspaceId: string;
  workspaceRoot: string;
  previewUrl: string;
  executionMode: VerificationExecutionMode;
}

export interface ExecuteVerificationExecutionResult {
  success: boolean;
  verificationId: string;
  previewUrl: string;
  verificationPlan: string[];
  verificationResults: VerificationResultEntry[];
  verificationArtifacts: VerificationArtifactEntry[];
  verificationEvidence: VerificationEvidenceEntry[];
  verificationWarnings: string[];
  verificationDiagnostics: VerificationDiagnosticEntry[];
  executionEvidence: VerificationExecutionEvidence;
  verificationDurationMs: number;
  realVerificationExecutionPerformed: boolean;
  blockingReasons: string[];
}
