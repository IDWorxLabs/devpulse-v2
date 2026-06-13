/**
 * Connected Live Preview Execution — core models.
 * Real founder-viewable preview activation inside disposable workspaces only.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import type { ConnectedRuntimeExecutionAssessment } from '../connected-runtime-execution/connected-runtime-execution-types.js';
import type { ConnectedWorkspaceCreationAssessment } from '../connected-workspace-creation/connected-workspace-creation-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import type { ExecutionPackageRuntimeReport } from '../execution-runtime/types.js';
import type { ExecutionVerificationReport } from '../execution-verification/types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { LivePreviewRealityAuthorityAssessment } from '../live-preview-reality/live-preview-reality-types.js';

export type PreviewExecutionState =
  | 'PREVIEW_ACTIVATED'
  | 'PREVIEW_ACTIVATED_WITH_WARNINGS'
  | 'PREVIEW_ACTIVATION_FAILED'
  | 'PREVIEW_ACTIVATION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type PreviewActivationMode = 'REAL_PREVIEW' | 'DRY_RUN' | 'BLOCKED';

export interface PreviewArtifactEntry {
  readOnly: true;
  path: string;
  category: string;
  sourceAuthority: string;
}

export interface PreviewEvidenceEntry {
  readOnly: true;
  evidenceId: string;
  evidenceType: string;
  summary: string;
  source: string;
  inspectedAt: string;
}

export interface PreviewDiagnosticEntry {
  readOnly: true;
  diagnosticId: string;
  label: string;
  value: string;
  source: string;
}

export interface PreviewActivationEvidence {
  readOnly: true;
  previewActivated: boolean;
  previewUrlGenerated: boolean;
  previewReachable: boolean;
  previewContentServed: boolean;
  previewArtifactsPresent: boolean;
  previewResponseSuccessful: boolean;
  previewEndpointAvailable: boolean;
  inspectedAt: string;
  inspectionSource: 'real-preview-activation-inspection';
}

export interface PreviewActivationContract {
  readOnly: true;
  previewId: string;
  workspaceId: string;
  previewUrl: string;
  previewType: string;
  previewActivationDurationMs: number;
  previewArtifacts: PreviewArtifactEntry[];
  previewEvidence: PreviewEvidenceEntry[];
  previewWarnings: string[];
  previewDiagnostics: PreviewDiagnosticEntry[];
  activationEvidence: PreviewActivationEvidence;
  realPreviewLaunchPerformed: boolean;
  founderViewable: boolean;
  world1Protected: true;
  disposableOnly: true;
}

export interface PreviewExecutionQuestionAnswers {
  previewActivationAttempted: boolean;
  previewUrlGenerated: boolean;
  previewReachable: boolean;
  contentBeingServed: boolean;
  previewIsolated: boolean;
  world1Protected: boolean;
  activationAuditable: boolean;
  founderInspectable: boolean;
  previewReadinessProven: boolean;
  previewActivationProven: boolean;
}

export interface ConnectedLivePreviewExecutionInputSnapshot {
  readOnly: true;
  connectedRuntimeExecutionAssessment: ConnectedRuntimeExecutionAssessment;
  connectedWorkspaceCreationAssessment: ConnectedWorkspaceCreationAssessment | null;
  connectedBuildExecutionFoundationAssessment: ConnectedBuildExecutionAssessment | null;
  connectedLivePreviewFoundationAssessment: ConnectedLivePreviewAssessment;
  livePreviewRealityAssessment: LivePreviewRealityAuthorityAssessment;
  executionPackageRuntimeReport: ExecutionPackageRuntimeReport;
  executionVerificationReport: ExecutionVerificationReport;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment | null;
  missingAuthorities: string[];
}

export interface ConnectedLivePreviewExecutionReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  executionId: string;
  generatedAt: string;
  previewScore: number;
  previewState: PreviewExecutionState;
  previewUrl: string | null;
  previewActivationDurationMs: number;
  activationContract: PreviewActivationContract | null;
  blockingStages: string[];
  warningStages: string[];
  recommendedNextActions: string[];
  questionAnswers: PreviewExecutionQuestionAnswers;
  inputSnapshot: ConnectedLivePreviewExecutionInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface ConnectedLivePreviewExecutionAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'PREVIEW_EXECUTION_COMPLETE' | 'PREVIEW_EXECUTION_FAILED';
  report: ConnectedLivePreviewExecutionReport;
}

export interface AssessConnectedLivePreviewExecutionInput {
  rootDir?: string;
  connectedRuntimeExecutionAssessment?: ConnectedRuntimeExecutionAssessment;
  connectedWorkspaceCreationAssessment?: ConnectedWorkspaceCreationAssessment;
  connectedBuildExecutionFoundationAssessment?: ConnectedBuildExecutionAssessment;
  connectedLivePreviewFoundationAssessment?: ConnectedLivePreviewAssessment;
  executionProofAssessment?: ExecutionProofAssessment | null;
  founderAcceptanceAssessment?: FounderAcceptanceAssessment | null;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment;
  performRealPreview?: boolean;
}

export interface ConnectedLivePreviewExecutionHistoryEntry {
  timestamp: string;
  executionId: string;
  previewScore: number;
  previewState: PreviewExecutionState;
  workspaceId: string;
  previewUrl: string | null;
  realPreviewLaunchPerformed: boolean;
  blockerCount: number;
  warningCount: number;
}

export interface ConnectedLivePreviewExecutionHistorySummary {
  totalAssessments: number;
  activatedPreviews: number;
  activatedWithWarningsPreviews: number;
  failedActivations: number;
  blockedActivations: number;
  insufficientEvidenceActivations: number;
}

export interface ConnectedLivePreviewExecutionArtifacts {
  connectedLivePreviewExecutionAssessment: ConnectedLivePreviewExecutionAssessment;
  connectedLivePreviewExecutionReportMarkdown: string;
}

export interface ExecutePreviewActivationInput {
  projectRootDir: string;
  workspaceId: string;
  workspaceRoot: string;
  previewType: string;
  runtimeType: string;
  buildArtifacts: string[];
  activationMode: PreviewActivationMode;
  runtimePort?: number;
}

export interface ExecutePreviewActivationResult {
  success: boolean;
  previewId: string;
  previewUrl: string;
  previewArtifacts: PreviewArtifactEntry[];
  previewEvidence: PreviewEvidenceEntry[];
  previewWarnings: string[];
  previewDiagnostics: PreviewDiagnosticEntry[];
  activationEvidence: PreviewActivationEvidence;
  previewActivationDurationMs: number;
  realPreviewLaunchPerformed: boolean;
  blockingReasons: string[];
}
