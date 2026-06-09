/**
 * Cloud Recovery Foundation — Persistent Build Runtime Foundation bridge.
 */

import { getPersistentBuild, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getStoredCloudRecovery, listStoredCloudRecoveries, storeCloudRecovery } from './cloud-recovery-store.js';
import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import type { CloudRecovery, CloudRecoveryPersistentBuildLink } from './cloud-recovery-types.js';
import { CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE } from './cloud-recovery-types.js';

export function linkRecoveryToPersistentBuild(
  recoveryId: string,
  persistentBuildId: string,
): CloudRecoveryPersistentBuildLink | null {
  const recovery = getStoredCloudRecovery(recoveryId);
  const build = getPersistentBuild(persistentBuildId);
  if (!recovery || !build) return null;

  const mismatch = build.buildOwner.projectId !== recovery.recoveryOwner.projectId;
  const link: CloudRecoveryPersistentBuildLink = {
    persistentBuildId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudRecovery({
    ...recovery,
    recoveryPersistentBuildLink: link,
    recoveryOwner: { ...recovery.recoveryOwner, persistentBuildId },
    recoveryRelationships: {
      ...recovery.recoveryRelationships,
      relatedPersistentBuildIds: [
        ...new Set([...recovery.recoveryRelationships.relatedPersistentBuildIds, persistentBuildId]),
      ],
    },
    updatedAt: Date.now(),
  });

  recordCloudRecoveryHistoryEntry({
    recoveryId,
    category: 'PERSISTENT_BUILD',
    summary: `Linked to persistent build ${persistentBuildId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: persistentBuildId,
  });

  return link;
}

export function getPersistentBuildForRecovery(recoveryId: string): string | null {
  return getStoredCloudRecovery(recoveryId)?.recoveryPersistentBuildLink.persistentBuildId ?? null;
}

export function listRecoveriesByPersistentBuild(persistentBuildId: string): CloudRecovery[] {
  return listStoredCloudRecoveries().filter(
    (r) =>
      r.recoveryPersistentBuildLink.persistentBuildId === persistentBuildId ||
      r.recoveryOwner.persistentBuildId === persistentBuildId,
  );
}

export function detectRecoveryBuildMismatch(recoveryId: string): boolean {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) return true;
  const build = getPersistentBuild(recovery.recoveryPersistentBuildLink.persistentBuildId);
  if (!build) return true;
  return (
    build.buildOwner.projectId !== recovery.recoveryOwner.projectId ||
    recovery.recoveryPersistentBuildLink.mismatchDetected
  );
}

export function resolvePersistentBuildForRecoveryRegistration(
  persistentBuildId: string,
): { exists: boolean; projectId: string | null; runtimeId: string | null; workspaceId: string | null } {
  const build = getPersistentBuild(persistentBuildId);
  if (!build) return { exists: false, projectId: null, runtimeId: null, workspaceId: null };
  return {
    exists: true,
    projectId: build.buildOwner.projectId,
    runtimeId: build.buildOwner.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
  };
}

export function listAvailablePersistentBuildIdsForRecoveryBridge(): string[] {
  return listPersistentBuilds().map((b) => b.buildId);
}
