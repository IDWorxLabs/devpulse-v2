/**
 * Workspace Reality Audit V1 — evidence types.
 */

export const WORKSPACE_REALITY_AUDIT_V1_PASS_TOKEN = 'WORKSPACE_REALITY_AUDIT_V1_PASS';

export const WORKSPACE_REALITY_AUDIT_FILENAME = 'workspace-reality-audit.json';
export const WORKSPACE_REALITY_AUDIT_REPORT_MD = 'workspace-reality-report.md';
export const WORKSPACE_REALITY_AUDIT_WORKSPACE_FILENAME = '.workspace-reality-audit.json';

export type WorkspaceRealityAuditStatus = 'PASS' | 'WARN' | 'FAIL' | 'PENDING';

export type WorkspaceRealityDimensionId =
  | 'sourceTree'
  | 'importGraph'
  | 'routeGraph'
  | 'registryConsistency'
  | 'contractUsage'
  | 'assetReality'
  | 'metadataConsistency'
  | 'orphanLeakage'
  | 'exportSafety';

export interface WorkspaceRealityDimensionResult {
  readOnly: true;
  id: WorkspaceRealityDimensionId;
  label: string;
  status: WorkspaceRealityAuditStatus;
  score: number;
  evidencePaths: string[];
  failureReasons: string[];
  warnings: string[];
}

export interface WorkspaceRealityAuditResult {
  readOnly: true;
  status: WorkspaceRealityAuditStatus;
  score: number;
  dimensions: WorkspaceRealityDimensionResult[];
  orphanFiles: string[];
  duplicateModules: string[];
  missingImports: string[];
  brokenRoutes: string[];
  missingAssets: string[];
  staleMetadata: string[];
  temporaryArtifactLeaks: string[];
  exportSafetyIssues: string[];
  evidencePaths: string[];
  failureReasons: string[];
  auditedSourceRoot: string;
  recordedAt: string;
  buildRunId: string;
  projectId: string;
  artifactPath: string | null;
  reportPath: string | null;
  persistentArtifactPath: string | null;
  persistentReportPath: string | null;
}

export interface WorkspaceRealityAuditEvidence {
  readOnly: true;
  workspaceRealityAuditStatus: WorkspaceRealityAuditStatus;
  workspaceRealityAuditScore: number;
  workspaceRealityAuditArtifactPath: string | null;
  workspaceRealityReportPath: string | null;
  workspaceRealityFailureReasons: string[];
  workspaceRealityRecordedAt: string;
  workspaceRealityAuditResult: WorkspaceRealityAuditResult;
}

export interface WorkspaceRealityAuditRecordingResult {
  readOnly: true;
  result: WorkspaceRealityAuditResult;
  evidence: WorkspaceRealityAuditEvidence;
}
