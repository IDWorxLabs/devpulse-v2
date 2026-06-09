/**
 * Cloud Runtime Foundation — history tracking.
 */

import { nextHistoryEntryId, storeHistoryEntry, listStoredHistoryEntries } from './cloud-runtime-store.js';
import type { CloudRuntimeHistoryEntry } from './cloud-runtime-types.js';

export function recordHistoryEntry(input: {
  runtimeId: string;
  category: CloudRuntimeHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): CloudRuntimeHistoryEntry {
  const entry: CloudRuntimeHistoryEntry = {
    entryId: nextHistoryEntryId(),
    runtimeId: input.runtimeId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeHistoryEntry(entry);
  return entry;
}

export function getRuntimeHistory(runtimeId?: string): CloudRuntimeHistoryEntry[] {
  const all = listStoredHistoryEntries();
  if (!runtimeId) return all;
  return all.filter((e) => e.runtimeId === runtimeId);
}

export function getStateHistory(runtimeId: string): CloudRuntimeHistoryEntry[] {
  return getRuntimeHistory(runtimeId).filter((e) => e.category === 'STATE');
}

export function getOwnershipHistory(runtimeId: string): CloudRuntimeHistoryEntry[] {
  return getRuntimeHistory(runtimeId).filter((e) => e.category === 'OWNERSHIP');
}

export function getWorkspaceHistory(workspaceId: string): CloudRuntimeHistoryEntry[] {
  return listStoredHistoryEntries().filter(
    (e) => e.scopeUsed === workspaceId || e.summary.includes(workspaceId),
  );
}

export function getProjectHistory(projectId: string): CloudRuntimeHistoryEntry[] {
  return listStoredHistoryEntries().filter(
    (e) => e.scopeUsed === projectId || e.summary.includes(projectId),
  );
}

export function getLifecycleHistory(runtimeId: string): CloudRuntimeHistoryEntry[] {
  return getRuntimeHistory(runtimeId).filter((e) => e.category === 'LIFECYCLE');
}

export function getSessionHistory(runtimeId: string): CloudRuntimeHistoryEntry[] {
  return getRuntimeHistory(runtimeId).filter((e) => e.category === 'SESSION');
}

export function listHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}

export function listScopeUsage(): string[] {
  const scopes = new Set<string>();
  for (const entry of listStoredHistoryEntries()) {
    if (entry.scopeUsed) scopes.add(entry.scopeUsed);
  }
  return [...scopes];
}

export function resetCloudRuntimeHistoryForTests(): void {
  /* cleared via store reset */
}
