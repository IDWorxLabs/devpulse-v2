/**
 * Autonomous Builder Foundation — Project Vault bridge.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildSession, AutonomousBuildProjectVaultLink } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

export function linkAutonomousBuildToProjectVault(
  autonomousBuildId: string,
  vaultProjectId: string,
): AutonomousBuildProjectVaultLink | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.getProject(vaultProjectId);
  const mismatch = !project || project.projectId !== record.buildOwnership.projectId;

  const link: AutonomousBuildProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeAutonomousBuildRecord({
    ...record,
    buildProjectVaultLink: link,
    updatedAt: Date.now(),
  });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'PROJECT_VAULT',
    summary: `Linked to project vault ${vaultProjectId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: vaultProjectId,
  });

  return link;
}

export function getProjectVaultForAutonomousBuild(autonomousBuildId: string): string | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildProjectVaultLink.vaultProjectId ?? null;
}

export function listAutonomousBuildsByProjectVault(vaultProjectId: string): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter(
    (r) => r.buildProjectVaultLink.vaultProjectId === vaultProjectId,
  );
}

export function detectAutonomousBuildProjectVaultMismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.getProject(record.buildProjectVaultLink.vaultProjectId);
  if (!project) return true;
  return (
    project.projectId !== record.buildOwnership.projectId ||
    record.buildProjectVaultLink.mismatchDetected
  );
}
