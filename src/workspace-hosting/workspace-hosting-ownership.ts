/**
 * Workspace Hosting Foundation — ownership tracking.
 */

import { WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE } from './workspace-hosting-types.js';
import type { WorkspaceHistoryEntry, WorkspaceOwnership } from './workspace-hosting-types.js';
import { nextWorkspaceHistoryEntryId, storeWorkspaceHistoryEntry } from './workspace-hosting-store.js';

export function buildWorkspaceOwnership(input: {
  projectId: string;
  runtimeId: string;
  createdBy?: string;
  workspaceSessionId?: string | null;
}): WorkspaceOwnership {
  return {
    ownerModule: WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'workspace_hosting_foundation',
    createdBy: input.createdBy ?? WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceSessionId: input.workspaceSessionId ?? null,
    workspaceAuthority: WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordWorkspaceOwnershipHistory(
  workspaceId: string,
  summary: string,
  consumer: string | null = null,
): WorkspaceHistoryEntry {
  const entry: WorkspaceHistoryEntry = {
    entryId: nextWorkspaceHistoryEntryId(),
    workspaceId,
    category: 'OWNERSHIP',
    summary,
    timestamp: Date.now(),
    consumer,
    scopeUsed: 'OWNERSHIP',
  };
  storeWorkspaceHistoryEntry(entry);
  return entry;
}

export function updateWorkspaceSessionOwnership(
  ownership: WorkspaceOwnership,
  sessionId: string,
): WorkspaceOwnership {
  return { ...ownership, workspaceSessionId: sessionId };
}
