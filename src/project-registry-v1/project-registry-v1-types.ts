/**
 * Project Registry V1 — canonical persisted project workspace registry.
 */

export type ProjectRegistryStatus = 'ACTIVE' | 'ARCHIVED';

export type ProjectRealityStatus = 'PENDING' | 'PROMOTED' | 'FAILED' | 'READY';

export type ProjectKind = 'USER' | 'AUDIT' | 'SYSTEM_TEST';

export interface ProjectRegistryRecord {
  projectId: string;
  name: string;
  projectKind?: ProjectKind;
  status: ProjectRegistryStatus;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  summary: string;
  persistentWorkspacePath?: string | null;
  sourceRoot?: string | null;
  aidevMetadataPath?: string | null;
  activeBuildHistoryRunId?: string | null;
  lastSuccessfulBuildRunId?: string | null;
  exportReady?: boolean;
  projectRealityStatus?: ProjectRealityStatus;
  materializationQualityScorePath?: string | null;
  materializationQualityScore?: number;
  materializationQualityVerdict?: string | null;
  featureContractRealityPath?: string | null;
  featureContractRealityScore?: number;
  featureContractRealityStatus?: string | null;
  workspaceRealityAuditPath?: string | null;
  workspaceRealityAuditScore?: number;
  workspaceRealityAuditStatus?: string | null;
}

export interface ProjectRegistryFile {
  version: 1;
  activeProjectId: string | null;
  projects: ProjectRegistryRecord[];
}

export interface ProjectRegistrySummaryItem {
  projectId: string;
  name: string;
  projectKind?: ProjectKind;
  status: ProjectRegistryStatus;
  summary: string;
  createdAt: string;
  lastActivityAt: string;
  isActive: boolean;
}

export const AUDIT_PROJECT_ISOLATION_AND_CLEANUP_V1_PASS_TOKEN =
  'AUDIT_PROJECT_ISOLATION_AND_CLEANUP_V1_PASS' as const;

export interface ProjectRegistrySummary {
  count: number;
  activeCount: number;
  items: ProjectRegistrySummaryItem[];
  activeProjectId: string | null;
}

export const PROJECT_REGISTRY_V1_PASS_TOKEN = 'PROJECT_REGISTRY_CONSISTENCY_V1_PASS' as const;

export const PROJECT_REGISTRY_DUPLICATE_NAME_CODE = 'DUPLICATE_PROJECT_NAME' as const;

export const PROJECT_REGISTRY_DUPLICATES_REPAIRED = 'PROJECT_REGISTRY_DUPLICATES_REPAIRED' as const;

export const PROJECT_REGISTRY_LOADED = 'PROJECT_REGISTRY_LOADED' as const;

export const PROJECT_REGISTRY_PROJECT_PERSISTED = 'PROJECT_REGISTRY_PROJECT_PERSISTED' as const;

export const PROJECT_REGISTRY_TEST_ROOT_SEGMENT = '.project-registry-test-root' as const;

export interface ProjectRegistryDuplicateRepairResult {
  repairedCount: number;
  archivedNames: string[];
  archivedProjectIds: string[];
  keptProjectIds: string[];
  mutated: boolean;
}

export class ProjectRegistryDuplicateNameError extends Error {
  readonly code: typeof PROJECT_REGISTRY_DUPLICATE_NAME_CODE;
  readonly displayName: string;
  readonly existingProjectId: string;
  readonly recoveryAction: string;

  constructor(displayName: string, existingProjectId: string) {
    super(
      `A project named ${displayName} already exists (internal id: ${existingProjectId}). ` +
        `Use Start fresh & retry to create an isolated build that keeps the display name, ` +
        `or open the existing project, or choose a different name for an explicit create.`,
    );
    this.name = 'ProjectRegistryDuplicateNameError';
    this.code = PROJECT_REGISTRY_DUPLICATE_NAME_CODE;
    this.displayName = displayName;
    this.existingProjectId = existingProjectId;
    this.recoveryAction =
      'Start fresh & retry (new internal project id, same display name), open the existing project, or pick a different name.';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
