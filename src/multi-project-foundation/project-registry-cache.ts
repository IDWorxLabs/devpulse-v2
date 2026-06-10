/**
 * Multi Project Foundation — registry lookup cache.
 */

import type { MultiProjectRecord, MultiProjectState } from './multi-project-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const projectByIdCache = new Map<string, MultiProjectRecord>();
const projectsByWorkspaceCache = new Map<string, MultiProjectRecord[]>();
const projectsByStateCache = new Map<MultiProjectState, MultiProjectRecord[]>();
const projectsByTypeCache = new Map<string, MultiProjectRecord[]>();

export function cacheProjectRecord(record: MultiProjectRecord): void {
  projectByIdCache.set(record.projectId, record);
  projectsByWorkspaceCache.delete(record.workspaceId);
  projectsByStateCache.delete(record.state);
  projectsByTypeCache.delete(record.projectType);
}

export function invalidateProjectCaches(projectId?: string, workspaceId?: string, state?: MultiProjectState, projectType?: string): void {
  if (projectId) projectByIdCache.delete(projectId);
  if (workspaceId) projectsByWorkspaceCache.delete(workspaceId);
  if (state) projectsByStateCache.delete(state);
  if (projectType) projectsByTypeCache.delete(projectType);
}

export function invalidateAllProjectCaches(): void {
  projectByIdCache.clear();
  projectsByWorkspaceCache.clear();
  projectsByStateCache.clear();
  projectsByTypeCache.clear();
}

export function getCachedProjectById(projectId: string): MultiProjectRecord | undefined {
  const cached = projectByIdCache.get(projectId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedProjectById(record: MultiProjectRecord): void {
  projectByIdCache.set(record.projectId, record);
}

export function getCachedProjectsByWorkspace(workspaceId: string): MultiProjectRecord[] | undefined {
  const cached = projectsByWorkspaceCache.get(workspaceId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedProjectsByWorkspace(workspaceId: string, records: MultiProjectRecord[]): void {
  projectsByWorkspaceCache.set(workspaceId, records);
}

export function getCachedProjectsByState(state: MultiProjectState): MultiProjectRecord[] | undefined {
  const cached = projectsByStateCache.get(state);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedProjectsByState(state: MultiProjectState, records: MultiProjectRecord[]): void {
  projectsByStateCache.set(state, records);
}

export function getCachedProjectsByType(projectType: string): MultiProjectRecord[] | undefined {
  const cached = projectsByTypeCache.get(projectType);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedProjectsByType(projectType: string, records: MultiProjectRecord[]): void {
  projectsByTypeCache.set(projectType, records);
}

export function getProjectRegistryCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetProjectRegistryCacheForTests(): void {
  invalidateAllProjectCaches();
  cacheHits = 0;
  cacheMisses = 0;
}
