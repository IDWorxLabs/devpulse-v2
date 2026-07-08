/**
 * Project Name Conflict Resolution V1 — types and shared project identity contract.
 */

export const PROJECT_NAME_CONFLICT_RESOLUTION_V1_PASS_TOKEN =
  'PROJECT_NAME_CONFLICT_RESOLUTION_V1_PASS';

export const PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION =
  'PROJECT_NAME_CONFLICT_RESOLUTION_V1';

export const PROJECT_NAME_CONFLICT_RESOLUTION_TRACE =
  'PROJECT_NAME_CONFLICT_RESOLUTION_APPLIED';

export const PROJECT_NAME_CONFLICT_RESOLUTION_API_PATH =
  '/api/projects/resolve-name-conflict';

export type ProjectNameConflictResolutionMode =
  | 'NO_CONFLICT'
  | 'EXISTING_PROJECT_CONTINUATION'
  | 'EXISTING_PROJECT_RECOVERY'
  | 'VERSIONED_REBUILD'
  | 'EXPLICIT_REJECTION';

export interface ProjectIdentityContract {
  readOnly: true;
  requestedName: string;
  resolvedProjectName: string;
  projectId: string;
  workspacePath: string | null;
  resolutionMode: ProjectNameConflictResolutionMode;
  conflictFound: boolean;
  continuationAllowed: boolean;
  reason: string;
  existingProjectId?: string | null;
  createdProject: boolean;
}

export interface ProjectNameConflictResolutionInput {
  requestedName: string;
  rawPrompt?: string;
  summary?: string;
  rootDir?: string;
  repoRootDir?: string;
  rejectDuplicates?: boolean;
  forceFreshRebuild?: boolean;
  confirmFreshCopy?: boolean;
}

export interface ProjectNameConflictResolutionPlan {
  readOnly: true;
  requestedName: string;
  resolvedProjectName: string;
  projectId: string | null;
  workspacePath: string | null;
  resolutionMode: ProjectNameConflictResolutionMode;
  conflictFound: boolean;
  continuationAllowed: boolean;
  reason: string;
  existingProjectId?: string | null;
  shouldCreateProject: boolean;
  shouldFail: boolean;
}

export interface ProjectNameConflictEvidenceRecord {
  readOnly: true;
  contractVersion: typeof PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION;
  recordedAt: string;
  identity: ProjectIdentityContract;
  featureRegistryEntry: string;
  routeRegistryEntry: string;
  manifestUpdated: boolean;
  buildHistoryRecorded: boolean;
  workspaceRealityAudited: boolean;
  projectSourcePath: string | null;
  livePreviewProof: string | null;
}
