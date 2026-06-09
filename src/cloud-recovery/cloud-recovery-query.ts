/**
 * Cloud Recovery Foundation — query layer.
 */

import { listStoredCloudRecoveries, listStoredCloudRecoverySessions } from './cloud-recovery-store.js';
import type { CloudRecovery, CloudRecoveryCategory } from './cloud-recovery-types.js';

export interface CloudRecoveryQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  verificationId?: string;
  ownerModule?: string;
  recoveryType?: CloudRecoveryCategory;
  recoveryState?: CloudRecovery['recoveryState'];
}

export function queryRecoveries(query: CloudRecoveryQuery = {}): CloudRecovery[] {
  return listStoredCloudRecoveries().filter((r) => {
    if (query.projectId && r.recoveryOwner.projectId !== query.projectId) return false;
    if (query.runtimeId && r.recoveryOwner.runtimeId !== query.runtimeId) return false;
    if (query.workspaceId && r.recoveryOwner.workspaceId !== query.workspaceId) return false;
    if (query.persistentBuildId && r.recoveryOwner.persistentBuildId !== query.persistentBuildId) return false;
    if (query.verificationId && r.recoveryOwner.verificationId !== query.verificationId) return false;
    if (query.ownerModule && r.recoveryOwner.ownerModule !== query.ownerModule) return false;
    if (query.recoveryType && r.recoveryType !== query.recoveryType) return false;
    if (query.recoveryState && r.recoveryState !== query.recoveryState) return false;
    return true;
  });
}

export function listRecoveries(): CloudRecovery[] {
  return listStoredCloudRecoveries();
}

export function listRecoveriesByProject(projectId: string): CloudRecovery[] {
  return queryRecoveries({ projectId });
}

export function listRecoveriesByRuntime(runtimeId: string): CloudRecovery[] {
  return queryRecoveries({ runtimeId });
}

export function listRecoveriesByWorkspace(workspaceId: string): CloudRecovery[] {
  return queryRecoveries({ workspaceId });
}

export function listRecoveriesByPersistentBuild(persistentBuildId: string): CloudRecovery[] {
  return queryRecoveries({ persistentBuildId });
}

export function listRecoveriesByVerification(verificationId: string): CloudRecovery[] {
  return queryRecoveries({ verificationId });
}

export function listRecoveriesByOwner(ownerModule: string): CloudRecovery[] {
  return queryRecoveries({ ownerModule });
}

export function listRecoveriesByType(recoveryType: CloudRecoveryCategory): CloudRecovery[] {
  return queryRecoveries({ recoveryType });
}

export function countRecoveriesByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of listStoredCloudRecoveries()) {
    counts[r.recoveryState] = (counts[r.recoveryState] ?? 0) + 1;
  }
  return counts;
}

export function countRecoverySessions(): number {
  return listStoredCloudRecoverySessions().length;
}
