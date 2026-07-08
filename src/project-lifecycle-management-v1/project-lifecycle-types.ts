/**
 * Project Lifecycle Management V1 — types.
 */

export const PROJECT_LIFECYCLE_MANAGEMENT_V1_PASS_TOKEN =
  'PROJECT_LIFECYCLE_MANAGEMENT_V1_PASS' as const;

export const PROJECT_LIFECYCLE_DELETE_ROUTE_V1_PASS_TOKEN =
  'PROJECT_LIFECYCLE_DELETE_ROUTE_V1_PASS' as const;

export const PROJECT_DELETED_SUCCESSFULLY = 'PROJECT_DELETED_SUCCESSFULLY' as const;

export type ProjectArtifactType =
  | 'REGISTRY_ENTRY'
  | 'PERSISTENT_WORKSPACE'
  | 'GENERATED_BUILDER_WORKSPACE'
  | 'GENERATED_SOURCE'
  | 'MANIFEST'
  | 'FEATURE_REGISTRY'
  | 'ROUTE_REGISTRY'
  | 'METADATA'
  | 'MATERIALIZATION_REPORT'
  | 'FEATURE_REALITY'
  | 'WORKSPACE_REALITY'
  | 'PRODUCTION_PROOF'
  | 'VERIFICATION_REPORT'
  | 'AUDIT_LOG'
  | 'LIVE_PREVIEW_RUNTIME'
  | 'RUNTIME_CACHE'
  | 'PROJECT_MEMORY'
  | 'EXECUTION_HISTORY'
  | 'BUILD_HISTORY'
  | 'FAILED_SNAPSHOT'
  | 'EXPORT_ARTIFACT'
  | 'TEMPORARY_FILE'
  | 'NOTIFICATION';

export type ProjectArtifactLifecycleState = 'ACTIVE' | 'ARCHIVED' | 'DELETED' | 'ORPHANED';

export interface ProjectOwnershipArtifact {
  readOnly: true;
  artifactId: string;
  projectId: string;
  owner: string;
  artifactType: ProjectArtifactType;
  path: string;
  createdAt: string;
  lifecycleState: ProjectArtifactLifecycleState;
  exclusive: boolean;
}

export interface ProjectOwnershipIndexFile {
  version: 1;
  updatedAt: string;
  artifacts: ProjectOwnershipArtifact[];
}

export interface ProjectArtifactDiscoveryResult {
  readOnly: true;
  projectId: string;
  artifacts: ProjectOwnershipArtifact[];
}

export type ProjectDeleteAuditStepStatus = 'REMOVED' | 'SKIPPED' | 'NOT_FOUND' | 'FAILED';

export interface ProjectDeleteAuditStep {
  readOnly: true;
  label: string;
  path: string | null;
  status: ProjectDeleteAuditStepStatus;
  detail: string | null;
}

export interface ProjectDeleteResult {
  readOnly: true;
  ok: boolean;
  projectId: string;
  projectName: string;
  token: typeof PROJECT_DELETED_SUCCESSFULLY | null;
  auditSteps: ProjectDeleteAuditStep[];
  orphanedFilesDetected: string[];
  runtimeTeardown: {
    devServersStopped: number;
    previewSessionsClosed: number;
    workspaceSessionRemoved: boolean;
    activeProjectCleared: boolean;
  };
  error: string | null;
}

export interface ProjectDuplicateResult {
  readOnly: true;
  ok: boolean;
  sourceProjectId: string;
  newProjectId: string;
  newProjectName: string;
  copiedArtifacts: string[];
  error: string | null;
}

export interface ProjectRestoreResult {
  readOnly: true;
  ok: boolean;
  projectId: string;
  workspaceValid: boolean;
  registryRelinked: boolean;
  warnings: string[];
  error: string | null;
}

export type OrphanRemediationAction = 'DELETE' | 'RECOVER' | 'REATTACH';

export interface ProjectOrphanRecord {
  readOnly: true;
  orphanId: string;
  path: string;
  artifactType: ProjectArtifactType;
  suggestedOwnerProjectId: string | null;
  detectedAt: string;
}

export interface ProjectOwnershipAuditResult {
  readOnly: true;
  scannedAt: string;
  registeredProjectIds: string[];
  orphans: ProjectOrphanRecord[];
  orphanCount: number;
  referencedArtifactCount: number;
}

export interface PersistentProjectJsonShape {
  projectId?: string;
  projectName?: string;
  buildHistoryRecordPath?: string | null;
  immutableBuildLinks?: string[];
  lastFailedSnapshotPath?: string | null;
  manifestPath?: string | null;
  featureContractPath?: string | null;
  exportMetadataPath?: string | null;
  projectFileIndexPath?: string | null;
  productionValidationPath?: string | null;
  materializationQualityScorePath?: string | null;
  featureContractRealityPath?: string | null;
  workspaceRealityAuditPath?: string | null;
  activeWorkspacePath?: string | null;
  currentSourcePath?: string | null;
}
