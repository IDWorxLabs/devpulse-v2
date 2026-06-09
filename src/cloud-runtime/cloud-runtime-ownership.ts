/**
 * Cloud Runtime Foundation — ownership tracking.
 */

import { CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE } from './cloud-runtime-types.js';
import type { CloudRuntimeHistoryEntry, CloudRuntimeOwnership } from './cloud-runtime-types.js';
import { nextHistoryEntryId, storeHistoryEntry } from './cloud-runtime-store.js';

export function buildRuntimeOwnership(input: {
  projectId: string;
  workspaceId: string;
  createdBy?: string;
  runtimeSessionId?: string | null;
}): CloudRuntimeOwnership {
  return {
    ownerModule: CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'cloud_runtime_foundation',
    createdBy: input.createdBy ?? 'devpulse_v2_cloud_runtime_foundation',
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeSessionId: input.runtimeSessionId ?? null,
    runtimeAuthority: CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordOwnershipHistory(
  runtimeId: string,
  summary: string,
  consumer: string | null = null,
): CloudRuntimeHistoryEntry {
  const entry: CloudRuntimeHistoryEntry = {
    entryId: nextHistoryEntryId(),
    runtimeId,
    category: 'OWNERSHIP',
    summary,
    timestamp: Date.now(),
    consumer,
    scopeUsed: 'OWNERSHIP',
  };
  storeHistoryEntry(entry);
  return entry;
}

export function updateRuntimeSessionOwnership(
  ownership: CloudRuntimeOwnership,
  sessionId: string,
): CloudRuntimeOwnership {
  return {
    ...ownership,
    runtimeSessionId: sessionId,
  };
}
