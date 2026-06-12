/**
 * Connected Live Preview Foundation — core models.
 * Runtime Readiness → Preview Readiness bridge only — no preview launch or browser startup.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import type { ExecutionPackageRuntimeReport } from '../execution-runtime/types.js';
import type { ExecutionVerificationReport } from '../execution-verification/types.js';
import type { LivePreviewRealityAuthorityAssessment } from '../live-preview-reality/live-preview-reality-types.js';
import type { World2ChangeSetMaterializerAssessment } from '../world2-change-set-materializer/world2-change-set-materializer-types.js';
import type { World2DryRunExecutionVerificationAssessment } from '../world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-types.js';
import type { World2ExecutionEngineAssessment } from '../world2-execution-engine/world2-execution-engine-types.js';
import type { World2RepositorySnapshotMaterializerAssessment } from '../world2-repository-snapshot-materializer/world2-repository-snapshot-materializer-types.js';

export type PreviewState =
  | 'PREVIEW_READY'
  | 'PREVIEW_READY_WITH_WARNINGS'
  | 'PREVIEW_NOT_READY'
  | 'PREVIEW_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface PreviewReadinessEntry {
  readOnly: true;
  entryId: string;
  label: string;
  sourceAuthority: string;
  detail: string;
}

export interface PreviewReadinessArtifactEntry {
  readOnly: true;
  name: string;
  path: string | null;
  category: string;
  sourceAuthority: string;
}

export interface PreviewCandidate {
  readOnly: true;
  candidateId: string;
  workspaceId: string;
  runtimeActivationContractId: string;
  previewType: string;
  previewActivationPath: string | null;
  modeledOnly: true;
  realPreviewLaunchPerformed: false;
}

export interface PreviewReadinessContract {
  readOnly: true;
  contractId: string;
  workspaceId: string;
  previewType: string;
  previewRequirements: PreviewReadinessEntry[];
  previewArtifacts: PreviewReadinessArtifactEntry[];
  previewDependencies: PreviewReadinessEntry[];
  previewActivationSteps: PreviewReadinessEntry[];
  verificationRequirements: PreviewReadinessEntry[];
  rollbackRequirements: PreviewReadinessEntry[];
  proofArtifacts: PreviewReadinessArtifactEntry[];
  realPreviewLaunchPerformed: false;
}

export interface PreviewReadinessQuestionAnswers {
  runtimeReadinessExists: boolean;
  previewCandidateExists: boolean;
  previewActivationPathExists: boolean;
  previewDependenciesKnown: boolean;
  previewActivationDescribable: boolean;
  previewActivationReproducible: boolean;
  previewActivationVerifiable: boolean;
  founderInspectable: boolean;
  previewReadinessTraceable: boolean;
  previewReadinessProven: boolean;
}

export interface ConnectedLivePreviewInputSnapshot {
  readOnly: true;
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment;
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment;
  livePreviewRealityAssessment: LivePreviewRealityAuthorityAssessment;
  executionEngineAssessment: World2ExecutionEngineAssessment;
  repositorySnapshotMaterializerAssessment: World2RepositorySnapshotMaterializerAssessment;
  changeSetMaterializerAssessment: World2ChangeSetMaterializerAssessment;
  dryRunVerifierAssessment: World2DryRunExecutionVerificationAssessment;
  executionPackageRuntimeReport: ExecutionPackageRuntimeReport;
  executionVerificationReport: ExecutionVerificationReport;
  missingAuthorities: string[];
}

export interface ConnectedLivePreviewReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  previewConnectionId: string;
  generatedAt: string;
  previewReadinessScore: number;
  previewState: PreviewState;
  previewCompleteness: number;
  dependencyCompleteness: number;
  proofCompleteness: number;
  missingPreviewComponents: string[];
  previewActivationPath: string[];
  recommendedNextActions: string[];
  questionAnswers: PreviewReadinessQuestionAnswers;
  previewCandidate: PreviewCandidate;
  previewReadinessContract: PreviewReadinessContract;
  inputSnapshot: ConnectedLivePreviewInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface ConnectedLivePreviewAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'PREVIEW_READINESS_COMPLETE' | 'PREVIEW_READINESS_FAILED';
  report: ConnectedLivePreviewReport;
}

export interface AssessConnectedLivePreviewInput {
  rootDir?: string;
  connectedRuntimeActivationAssessment?: ConnectedRuntimeActivationAssessment;
  livePreviewRealityAssessment?: LivePreviewRealityAuthorityAssessment;
}

export interface ConnectedLivePreviewHistoryEntry {
  timestamp: string;
  previewConnectionId: string;
  previewReadinessScore: number;
  previewState: PreviewState;
  blockerCount: number;
  warningCount: number;
}

export interface ConnectedLivePreviewHistorySummary {
  totalAssessments: number;
  readyPreviews: number;
  readyWithWarningsPreviews: number;
  notReadyPreviews: number;
  blockedPreviews: number;
  insufficientEvidencePreviews: number;
}

export interface ConnectedLivePreviewArtifacts {
  connectedLivePreviewAssessment: ConnectedLivePreviewAssessment;
  connectedLivePreviewReportMarkdown: string;
}
