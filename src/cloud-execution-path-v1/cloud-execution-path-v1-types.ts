/**
 * Cloud Execution Path V1 — type definitions.
 */

export type CloudExecutionMode = 'LOCAL' | 'CLOUD_SIMULATED' | 'CLOUD_READY';

export type CloudExecutionJobStatus =
  | 'QUEUED'
  | 'CLAIMED'
  | 'PREPARING'
  | 'BUILDING'
  | 'PREVIEWING'
  | 'VERIFYING'
  | 'REVIEWING'
  | 'PRODUCTION_CHECK'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type CloudExecutionFailureClass =
  | 'QUEUE_FAILURE'
  | 'CLAIM_FAILURE'
  | 'WORKSPACE_FAILURE'
  | 'MATERIALIZATION_FAILURE'
  | 'INSTALL_FAILURE'
  | 'BUILD_FAILURE'
  | 'PREVIEW_FAILURE'
  | 'VERIFICATION_FAILURE'
  | 'REVIEW_FAILURE'
  | 'PRODUCTION_GATE_FAILURE'
  | 'ARTIFACT_HANDOFF_FAILURE'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface RequirementsSnapshot {
  readOnly: true;
  profile: string;
  productName: string;
  prompt: string;
  requirementConfidence: number | null;
}

export interface BuildPlanSnapshot {
  readOnly: true;
  contractId: string | null;
  planningSummary: string;
  codegenProfile: string;
}

export interface WorkspaceSpec {
  readOnly: true;
  workspaceId: string;
  workspacePath: string;
  isolationToken: string;
  boundedLogsMaxLines: number;
  boundedArtifactsMaxBytes: number;
  runtimeTimeoutMs: number;
}

export interface CloudExecutionJob {
  readOnly: true;
  jobId: string;
  projectId: string;
  prompt: string;
  requirementsSnapshot: RequirementsSnapshot;
  buildPlan: BuildPlanSnapshot;
  workspaceSpec: WorkspaceSpec;
  executionMode: CloudExecutionMode;
  requestedAt: string;
  status: CloudExecutionJobStatus;
  claimedAt: string | null;
  completedAt: string | null;
  workerId: string | null;
  currentStage: string | null;
  runtimeDurationMs: number | null;
}

export interface CloudExecutionFailureReport {
  readOnly: true;
  jobId: string;
  failureClass: CloudExecutionFailureClass;
  stage: CloudExecutionJobStatus;
  detail: string;
  recoverable: boolean;
  generatedAt: string;
}

export interface CloudJobArtifactStatus {
  readOnly: true;
  sourceManifest: boolean;
  buildLogs: boolean;
  previewProof: boolean;
  uvlVerificationProof: boolean;
  productArchitectProof: boolean;
  aflaVerdict: boolean;
  productionReadinessResult: boolean;
  executionSummary: boolean;
  cloudJobPackage: boolean;
}

export interface CloudJobPackage {
  readOnly: true;
  contractVersion: 'V1';
  jobId: string;
  projectId: string;
  executionMode: CloudExecutionMode;
  jobMetadata: {
    profile: string;
    productName: string;
    requestedAt: string;
    workerId: string | null;
  };
  prompt: string;
  requirementsSnapshot: RequirementsSnapshot;
  buildPlan: BuildPlanSnapshot;
  workspaceSpec: WorkspaceSpec;
  expectedArtifactOutputs: readonly string[];
  validationRequirements: readonly string[];
  generatedAt: string;
}

export interface CloudExecutionJobResult {
  readOnly: true;
  job: CloudExecutionJob;
  passed: boolean;
  failureReport: CloudExecutionFailureReport | null;
  artifactStatus: CloudJobArtifactStatus;
  cloudJobPackage: CloudJobPackage | null;
  buildProof: boolean;
  previewProof: boolean;
  verificationProof: boolean;
  aflaVerdict: string | null;
  paiResult: string | null;
  productionReadinessScore: number | null;
  productionReadinessVerdict: string | null;
  executionSummary: string;
  contaminationCheckPassed: boolean;
}

export interface CloudExecutionPathV1Assessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: string;
  passToken: string;
  version: 'V1';
  generatedAt: string;
  jobsSubmitted: number;
  jobsCompleted: number;
  jobsFailed: number;
  concurrentJobsProven: number;
  contaminationIncidents: number;
  cloudSimulatedProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  cloudReadyPackagesGenerated: number;
  jobResults: readonly CloudExecutionJobResult[];
  queueSnapshot: {
    queued: number;
    active: number;
    completed: number;
    failed: number;
  };
}
