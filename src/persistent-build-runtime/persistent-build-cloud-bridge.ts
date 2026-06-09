/**
 * Persistent Build Runtime Foundation — Cloud Runtime Foundation bridge.
 */

import { getRuntime, listRuntimes } from '../cloud-runtime/index.js';
import { getStoredPersistentBuild, listStoredPersistentBuilds, storePersistentBuild } from './persistent-build-store.js';
import { recordPersistentBuildHistoryEntry } from './persistent-build-history.js';
import type { PersistentBuild, PersistentBuildCloudRuntimeLink } from './persistent-build-types.js';
import { PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE } from './persistent-build-types.js';

export function linkBuildToRuntime(buildId: string, runtimeId: string): PersistentBuildCloudRuntimeLink | null {
  const build = getStoredPersistentBuild(buildId);
  const runtime = getRuntime(runtimeId);
  if (!build || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== build.buildOwner.projectId;
  const link: PersistentBuildCloudRuntimeLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePersistentBuild({
    ...build,
    buildCloudRuntimeLink: link,
    buildOwner: { ...build.buildOwner, runtimeId },
    buildRelationships: {
      ...build.buildRelationships,
      relatedRuntimeIds: [...new Set([...build.buildRelationships.relatedRuntimeIds, runtimeId])],
    },
    updatedAt: Date.now(),
  });

  recordPersistentBuildHistoryEntry({
    buildId,
    category: 'RUNTIME',
    summary: `Linked to runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getRuntimeForBuild(buildId: string): string | null {
  return getStoredPersistentBuild(buildId)?.buildCloudRuntimeLink.runtimeId ?? null;
}

export function listBuildsByRuntime(runtimeId: string): PersistentBuild[] {
  return listStoredPersistentBuilds().filter(
    (b) => b.buildCloudRuntimeLink.runtimeId === runtimeId || b.buildOwner.runtimeId === runtimeId,
  );
}

export function detectBuildRuntimeMismatch(buildId: string): boolean {
  const build = getStoredPersistentBuild(buildId);
  if (!build) return true;
  const runtime = getRuntime(build.buildCloudRuntimeLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== build.buildOwner.projectId ||
    build.buildCloudRuntimeLink.mismatchDetected
  );
}

export function resolveRuntimeForBuildRegistration(runtimeId: string): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}

export function listAvailableRuntimeIdsForBuildBridge(): string[] {
  return listRuntimes().map((r) => r.runtimeId);
}
