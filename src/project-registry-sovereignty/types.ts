/**
 * Registry Sovereignty V1 — types and tier constants.
 */

import type { ProjectKind } from '../project-registry-v1/project-kind.js';

export const REGISTRY_SOVEREIGNTY_V1_PASS_TOKEN = 'REGISTRY_SOVEREIGNTY_V1_PASS' as const;

export const REGISTRY_TIER_AUDIT_DIR = '.aidevengine-audit' as const;
export const REGISTRY_TIER_SYSTEM_DIR = '.aidevengine-system' as const;
export const LEGACY_AUDIT_VALIDATION_DIR = '.aidevengine-audit-validation' as const;

export type RegistryClass = 'USER' | 'AUDIT' | 'SYSTEM';

export type RegistrySovereigntyTrigger =
  | 'startup'
  | 'persist'
  | 'delete'
  | 'archive'
  | 'restore'
  | 'build'
  | 'audit'
  | 'validation'
  | 'cleanup'
  | 'runtime';

export interface RegistryTierCounts {
  readOnly: true;
  user: number;
  audit: number;
  system: number;
  userActive: number;
  persistentUser: number;
  persistentTotal: number;
}

export interface RegistryIntegrityIssue {
  readOnly: true;
  code:
    | 'AUDIT_IN_USER_REGISTRY'
    | 'SYSTEM_IN_USER_REGISTRY'
    | 'DUPLICATE_NORMALIZED_NAME'
    | 'INVALID_ACTIVE_PROJECT'
    | 'ORPHANED_WORKSPACE'
    | 'STALE_WORKSPACE_CACHE'
    | 'NESTED_TIER_REGISTRY_FILE';
  detail: string;
  projectId?: string;
}

export interface RegistrySovereigntyMigrationRecord {
  readOnly: true;
  projectId: string;
  name: string;
  registryClass: RegistryClass;
  projectKind: ProjectKind;
  from: 'user-registry' | 'legacy-audit-registry' | 'nested-tier-registry';
  to: 'user-registry' | 'audit-registry' | 'system-registry';
}

export interface RegistryDuplicateRepairRecord {
  readOnly: true;
  normalizedName: string;
  keptProjectId: string;
  archivedProjectIds: readonly string[];
}

export interface RegistrySovereigntyMigrationResult {
  readOnly: true;
  mutated: boolean;
  migrated: readonly RegistrySovereigntyMigrationRecord[];
  duplicateRepairs: readonly RegistryDuplicateRepairRecord[];
  repairedActiveProjectId: string | null;
  previousActiveProjectId: string | null;
  counts: RegistryTierCounts;
}

export interface RegistrySovereigntyReport {
  readOnly: true;
  trigger: RegistrySovereigntyTrigger;
  preview: boolean;
  issues: readonly RegistryIntegrityIssue[];
  migration: RegistrySovereigntyMigrationResult;
  deletedArtifactProjectIds: readonly string[];
  preservedUserProjectIds: readonly string[];
  errors: readonly string[];
  ok: boolean;
}

export interface RegistrySovereigntyCleanupInput {
  rootDir: string;
  confirmed?: boolean;
  preview?: boolean;
}

export type RegistrySovereigntyCleanupResult = RegistrySovereigntyReport & {
  confirmed: boolean;
};
