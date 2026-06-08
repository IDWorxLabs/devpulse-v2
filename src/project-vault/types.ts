/** DevPulse V2 Project Vault — types. */

export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export type ProjectFactSource = 'USER' | 'SYSTEM' | 'TRUST_ENGINE' | 'FOUNDATION';

export type ProjectFactConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectFact {
  factId: string;
  projectId: string;
  createdAt: number;
  source: ProjectFactSource;
  label: string;
  value: string;
  confidence: ProjectFactConfidence;
}

export interface ProjectRecord {
  projectId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  status: ProjectStatus;
  phase: string;
  summary: string;
  facts: ProjectFact[];
  warnings: string[];
  errors: string[];
}

export interface ProjectSnapshot {
  snapshotId: string;
  projectId: string;
  capturedAt: number;
  name: string;
  status: ProjectStatus;
  phase: string;
  summary: string;
  factCount: number;
  facts: ProjectFact[];
}

export interface ProjectVaultState {
  ownerModule: string;
  projectCount: number;
  activeProjectCount: number;
  factCount: number;
  snapshotCount: number;
  latestProjectId: string | null;
  warnings: string[];
  errors: string[];
}

export interface ProjectVaultReport {
  ownerModule: string;
  projectCount: number;
  activeProjectCount: number;
  factCount: number;
  latestProject: string | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
  summary: string;
}

export const VAULT_OWNER_MODULE = 'devpulse_v2_project_vault_authority';
export const VAULT_PASS_TOKEN = 'DEVPULSE_V2_PROJECT_VAULT_FOUNDATION_V1_PASS';

export const DEFAULT_PROJECT_PHASE = 'foundation';
