/**
 * Persistent Build Runtime Foundation — ownership tracking.
 */

import { PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE } from './persistent-build-types.js';
import type { PersistentBuildHistoryEntry, PersistentBuildOwnership } from './persistent-build-types.js';
import { nextBuildHistoryEntryId, storePersistentBuildHistoryEntry } from './persistent-build-store.js';

export function buildPersistentBuildOwnership(input: {
  projectId: string;
  workspaceId: string;
  runtimeId: string;
  createdBy?: string;
  buildSessionId?: string | null;
}): PersistentBuildOwnership {
  return {
    ownerModule: PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'persistent_build_runtime_foundation',
    createdBy: input.createdBy ?? PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeId: input.runtimeId,
    buildSessionId: input.buildSessionId ?? null,
    buildAuthority: PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordBuildOwnershipHistory(
  buildId: string,
  summary: string,
  consumer: string | null = null,
): PersistentBuildHistoryEntry {
  const entry: PersistentBuildHistoryEntry = {
    entryId: nextBuildHistoryEntryId(),
    buildId,
    category: 'OWNERSHIP',
    summary,
    timestamp: Date.now(),
    consumer,
    scopeUsed: 'OWNERSHIP',
  };
  storePersistentBuildHistoryEntry(entry);
  return entry;
}

export function updateBuildSessionOwnership(
  ownership: PersistentBuildOwnership,
  sessionId: string,
): PersistentBuildOwnership {
  return { ...ownership, buildSessionId: sessionId };
}
