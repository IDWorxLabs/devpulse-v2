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
