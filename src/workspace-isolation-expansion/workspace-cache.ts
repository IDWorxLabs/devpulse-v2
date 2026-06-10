/**
 * Workspace Isolation Expansion — lookup cache.
 */

import type { WorkspaceIsolationStatus, WorkspaceRecord, WorkspaceState } from './workspace-isolation-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const workspaceByIdCache = new Map<string, WorkspaceRecord>();
const workspacesByOwnerCache = new Map<string, WorkspaceRecord[]>();
const workspacesByStateCache = new Map<WorkspaceState, WorkspaceRecord[]>();
const workspacesByIsolationCache = new Map<WorkspaceIsolationStatus, WorkspaceRecord[]>();
const ownerByWorkspaceCache = new Map<string, string>();
const policyDecisionCache = new Map<string, string>();
const accessGrantCache = new Map<string, boolean>();

export function getCachedWorkspace(workspaceId: string): WorkspaceRecord | undefined {
  const cached = workspaceByIdCache.get(workspaceId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedWorkspace(record: WorkspaceRecord): void {
  workspaceByIdCache.set(record.workspaceId, record);
  workspacesByOwnerCache.delete(record.ownerProjectId);
  workspacesByStateCache.delete(record.state);
  workspacesByIsolationCache.delete(record.isolationStatus);
}

export function getCachedWorkspacesByOwner(ownerProjectId: string): WorkspaceRecord[] | undefined {
  const cached = workspacesByOwnerCache.get(ownerProjectId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedWorkspacesByOwner(ownerProjectId: string, records: WorkspaceRecord[]): void {
  workspacesByOwnerCache.set(ownerProjectId, records);
}

export function getCachedWorkspacesByState(state: WorkspaceState): WorkspaceRecord[] | undefined {
  const cached = workspacesByStateCache.get(state);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedWorkspacesByState(state: WorkspaceState, records: WorkspaceRecord[]): void {
  workspacesByStateCache.set(state, records);
}

export function getCachedWorkspacesByIsolation(status: WorkspaceIsolationStatus): WorkspaceRecord[] | undefined {
  const cached = workspacesByIsolationCache.get(status);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedWorkspacesByIsolation(status: WorkspaceIsolationStatus, records: WorkspaceRecord[]): void {
  workspacesByIsolationCache.set(status, records);
}

export function getCachedWorkspaceOwner(workspaceId: string): string | undefined {
  const cached = ownerByWorkspaceCache.get(workspaceId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedWorkspaceOwner(workspaceId: string, ownerProjectId: string): void {
  ownerByWorkspaceCache.set(workspaceId, ownerProjectId);
}

export function getCachedPolicyDecision(key: string): string | undefined {
  const cached = policyDecisionCache.get(key);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedPolicyDecision(key: string, decision: string): void {
  policyDecisionCache.set(key, decision);
}

export function getCachedAccessGrant(key: string): boolean | undefined {
  if (accessGrantCache.has(key)) {
    cacheHits += 1;
    return accessGrantCache.get(key);
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedAccessGrant(key: string, granted: boolean): void {
  accessGrantCache.set(key, granted);
}

export function invalidateWorkspaceCaches(workspaceId?: string, ownerProjectId?: string): void {
  if (workspaceId) workspaceByIdCache.delete(workspaceId);
  if (ownerProjectId) workspacesByOwnerCache.delete(ownerProjectId);
}

export function getWorkspaceCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetWorkspaceCacheForTests(): void {
  workspaceByIdCache.clear();
  workspacesByOwnerCache.clear();
  workspacesByStateCache.clear();
  workspacesByIsolationCache.clear();
  ownerByWorkspaceCache.clear();
  policyDecisionCache.clear();
  accessGrantCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
