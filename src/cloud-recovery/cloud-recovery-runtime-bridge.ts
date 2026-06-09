/**
 * Cloud Recovery Foundation — Cloud Runtime Foundation bridge.
 */

import { getRuntime, listRuntimes } from '../cloud-runtime/index.js';
import { getStoredCloudRecovery, listStoredCloudRecoveries, storeCloudRecovery } from './cloud-recovery-store.js';
import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import type { CloudRecovery, CloudRecoveryRuntimeLink } from './cloud-recovery-types.js';
import { CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE } from './cloud-recovery-types.js';

export function linkRecoveryToRuntime(recoveryId: string, runtimeId: string): CloudRecoveryRuntimeLink | null {
  const recovery = getStoredCloudRecovery(recoveryId);
  const runtime = getRuntime(runtimeId);
  if (!recovery || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== recovery.recoveryOwner.projectId;
  const link: CloudRecoveryRuntimeLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudRecovery({
    ...recovery,
    recoveryRuntimeLink: link,
    recoveryOwner: { ...recovery.recoveryOwner, runtimeId },
    recoveryRelationships: {
      ...recovery.recoveryRelationships,
      relatedRuntimeIds: [...new Set([...recovery.recoveryRelationships.relatedRuntimeIds, runtimeId])],
    },
    updatedAt: Date.now(),
  });

  recordCloudRecoveryHistoryEntry({
    recoveryId,
    category: 'RUNTIME',
    summary: `Linked to runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getRuntimeForRecovery(recoveryId: string): string | null {
  return getStoredCloudRecovery(recoveryId)?.recoveryRuntimeLink.runtimeId ?? null;
}

export function listRecoveriesByRuntime(runtimeId: string): CloudRecovery[] {
  return listStoredCloudRecoveries().filter(
    (r) => r.recoveryRuntimeLink.runtimeId === runtimeId || r.recoveryOwner.runtimeId === runtimeId,
  );
}

export function detectRecoveryRuntimeMismatch(recoveryId: string): boolean {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) return true;
  const runtime = getRuntime(recovery.recoveryRuntimeLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== recovery.recoveryOwner.projectId ||
    recovery.recoveryRuntimeLink.mismatchDetected
  );
}

export function resolveRuntimeForRecoveryRegistration(
  runtimeId: string,
): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}

export function listAvailableRuntimeIdsForRecoveryBridge(): string[] {
  return listRuntimes().map((r) => r.runtimeId);
}
