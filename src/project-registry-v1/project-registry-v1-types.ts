/**
 * Project Registry V1 — canonical persisted project workspace registry.
 */

export type ProjectRegistryStatus = 'ACTIVE' | 'ARCHIVED';

export interface ProjectRegistryRecord {
  projectId: string;
  name: string;
  status: ProjectRegistryStatus;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  summary: string;
}

export interface ProjectRegistryFile {
  version: 1;
  activeProjectId: string | null;
  projects: ProjectRegistryRecord[];
}

export interface ProjectRegistrySummaryItem {
  projectId: string;
  name: string;
  status: ProjectRegistryStatus;
  summary: string;
  createdAt: string;
  lastActivityAt: string;
  isActive: boolean;
}

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

  constructor(displayName: string, existingProjectId: string) {
    super(
      `A project named ${displayName} already exists. Choose a different name or open the existing project.`,
    );
    this.name = 'ProjectRegistryDuplicateNameError';
    this.code = PROJECT_REGISTRY_DUPLICATE_NAME_CODE;
    this.displayName = displayName;
    this.existingProjectId = existingProjectId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
