/**
 * Persistent Build Runtime Foundation — history tracking.
 */

import { nextBuildHistoryEntryId, storePersistentBuildHistoryEntry, listStoredPersistentBuildHistoryEntries } from './persistent-build-store.js';
import type { PersistentBuildHistoryEntry } from './persistent-build-types.js';

export function recordPersistentBuildHistoryEntry(input: {
  buildId: string;
  category: PersistentBuildHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): PersistentBuildHistoryEntry {
  const entry: PersistentBuildHistoryEntry = {
    entryId: nextBuildHistoryEntryId(),
    buildId: input.buildId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storePersistentBuildHistoryEntry(entry);
  return entry;
}

export function getPersistentBuildHistory(buildId?: string): PersistentBuildHistoryEntry[] {
  const all = listStoredPersistentBuildHistoryEntries();
  if (!buildId) return all;
  return all.filter((e) => e.buildId === buildId);
}

export function getBuildProgressHistory(buildId: string): PersistentBuildHistoryEntry[] {
  return getPersistentBuildHistory(buildId).filter((e) => e.category === 'PROGRESS');
}

export function getBuildContextHistory(buildId: string): PersistentBuildHistoryEntry[] {
  return getPersistentBuildHistory(buildId).filter((e) => e.category === 'CONTEXT');
}

export function getBuildResumeHistory(buildId: string): PersistentBuildHistoryEntry[] {
  return getPersistentBuildHistory(buildId).filter((e) => e.category === 'RESUME');
}

export function getBuildRuntimeLinkHistory(buildId: string): PersistentBuildHistoryEntry[] {
  return getPersistentBuildHistory(buildId).filter((e) => e.category === 'RUNTIME');
}

export function getBuildWorkspaceLinkHistory(buildId: string): PersistentBuildHistoryEntry[] {
  return getPersistentBuildHistory(buildId).filter((e) => e.category === 'WORKSPACE');
}

export function getBuildProjectHistory(projectId: string): PersistentBuildHistoryEntry[] {
  return listStoredPersistentBuildHistoryEntries().filter(
    (e) => e.scopeUsed === projectId || e.summary.includes(projectId),
  );
}

export function getBuildLifecycleHistory(buildId: string): PersistentBuildHistoryEntry[] {
  return getPersistentBuildHistory(buildId).filter((e) => e.category === 'LIFECYCLE');
}

export function listBuildHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredPersistentBuildHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
