/**
 * Build Strategy Engine — Project Vault bridge.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyProjectVaultLink } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function linkBuildStrategyToProjectVault(
  buildStrategyId: string,
  vaultProjectId: string,
): BuildStrategyProjectVaultLink | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.getProject(vaultProjectId);
  const mismatch = !project || project.projectId !== record.strategyOwnership.projectId;

  const link: BuildStrategyProjectVaultLink = {
    vaultProjectId,
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeBuildStrategyRecord({
    ...record,
    strategyProjectVaultLink: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'PROJECT_VAULT',
    summary: `Linked to project vault ${vaultProjectId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: vaultProjectId,
  });

  return link;
}

export function getProjectVaultForBuildStrategy(buildStrategyId: string): string | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyProjectVaultLink.vaultProjectId ?? null;
}

export function listBuildStrategiesByProjectVault(vaultProjectId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter(
    (r) => r.strategyProjectVaultLink.vaultProjectId === vaultProjectId,
  );
}

export function detectBuildStrategyProjectVaultMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  return record.strategyProjectVaultLink.mismatchDetected;
}
