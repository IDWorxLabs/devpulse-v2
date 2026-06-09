/**
 * Workspace Hosting Foundation — history tracking.
 */

import { nextWorkspaceHistoryEntryId, storeWorkspaceHistoryEntry, listStoredWorkspaceHistoryEntries } from './workspace-hosting-store.js';
import type { WorkspaceHistoryEntry } from './workspace-hosting-types.js';

export function recordWorkspaceHistoryEntry(input: {
  workspaceId: string;
  category: WorkspaceHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): WorkspaceHistoryEntry {
  const entry: WorkspaceHistoryEntry = {
    entryId: nextWorkspaceHistoryEntryId(),
    workspaceId: input.workspaceId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeWorkspaceHistoryEntry(entry);
  return entry;
}

export function getWorkspaceHistory(workspaceId?: string): WorkspaceHistoryEntry[] {
  const all = listStoredWorkspaceHistoryEntries();
  if (!workspaceId) return all;
  return all.filter((e) => e.workspaceId === workspaceId);
}

export function getWorkspaceStateHistoryEntries(workspaceId: string): WorkspaceHistoryEntry[] {
  return getWorkspaceHistory(workspaceId).filter((e) => e.category === 'STATE');
}

export function getWorkspaceOwnershipHistory(workspaceId: string): WorkspaceHistoryEntry[] {
  return getWorkspaceHistory(workspaceId).filter((e) => e.category === 'OWNERSHIP');
}

export function getWorkspaceRuntimeLinkHistory(workspaceId: string): WorkspaceHistoryEntry[] {
  return getWorkspaceHistory(workspaceId).filter((e) => e.category === 'RUNTIME');
}

export function getWorkspaceProjectHistory(projectId: string): WorkspaceHistoryEntry[] {
  return listStoredWorkspaceHistoryEntries().filter(
    (e) => e.scopeUsed === projectId || e.summary.includes(projectId),
  );
}

export function getWorkspaceIsolationHistory(workspaceId: string): WorkspaceHistoryEntry[] {
  return getWorkspaceHistory(workspaceId).filter((e) => e.category === 'ISOLATION');
}

export function getWorkspaceLifecycleHistory(workspaceId: string): WorkspaceHistoryEntry[] {
  return getWorkspaceHistory(workspaceId).filter((e) => e.category === 'LIFECYCLE');
}

export function getWorkspaceSessionHistory(workspaceId: string): WorkspaceHistoryEntry[] {
  return getWorkspaceHistory(workspaceId).filter((e) => e.category === 'SESSION');
}

export function listWorkspaceHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredWorkspaceHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
