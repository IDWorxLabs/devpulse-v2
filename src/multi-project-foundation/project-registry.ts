/**
 * Multi Project Foundation — project registry.
 */

import type { MultiProjectRecord, MultiProjectState, RegisterProjectInput } from './multi-project-types.js';
import { createProjectIdentity, reserveProjectIdentity } from './project-identity-manager.js';
import { registerWorkspaceFromRecord, removeWorkspaceMapping } from './project-workspace-mapper.js';
import { removeProjectContext } from './project-context-manager.js';
import {
  cacheProjectRecord,
  getCachedProjectById,
  getCachedProjectsByState,
  getCachedProjectsByType,
  getCachedProjectsByWorkspace,
  invalidateProjectCaches,
  setCachedProjectById,
  setCachedProjectsByState,
  setCachedProjectsByType,
  setCachedProjectsByWorkspace,
} from './project-registry-cache.js';

const registry = new Map<string, MultiProjectRecord>();

export function registerProject(input: RegisterProjectInput): MultiProjectRecord {
  const identity = createProjectIdentity(input.projectName);
  reserveProjectIdentity(identity);

  const now = Date.now();
  const record: MultiProjectRecord = {
    projectId: identity.projectId,
    projectName: input.projectName,
    projectType: input.projectType,
    state: 'CREATED',
    workspaceId: identity.workspaceId,
    createdAt: now,
    updatedAt: now,
  };

  registry.set(record.projectId, record);
  const mapping = registerWorkspaceFromRecord(record);
  if (!mapping.ok) {
    registry.delete(record.projectId);
    throw new Error(mapping.error);
  }

  cacheProjectRecord(record);
  setCachedProjectById(record);

  return record;
}

export function getProject(projectId: string): MultiProjectRecord | undefined {
  const cached = getCachedProjectById(projectId);
  if (cached) return cached;

  const record = registry.get(projectId);
  if (record) {
    setCachedProjectById(record);
  }
  return record;
}

export function listProjects(): MultiProjectRecord[] {
  return [...registry.values()];
}

export function getProjectRegistrySize(): number {
  return registry.size;
}

export function listProjectsByWorkspace(workspaceId: string): MultiProjectRecord[] {
  const cached = getCachedProjectsByWorkspace(workspaceId);
  if (cached) return cached;

  const records = [...registry.values()].filter((r) => r.workspaceId === workspaceId);
  setCachedProjectsByWorkspace(workspaceId, records);
  return records;
}

export function listProjectsByState(state: MultiProjectState): MultiProjectRecord[] {
  const cached = getCachedProjectsByState(state);
  if (cached) return cached;

  const records = [...registry.values()].filter((r) => r.state === state);
  setCachedProjectsByState(state, records);
  return records;
}

export function listProjectsByType(projectType: string): MultiProjectRecord[] {
  const cached = getCachedProjectsByType(projectType);
  if (cached) return cached;

  const records = [...registry.values()].filter((r) => r.projectType === projectType);
  setCachedProjectsByType(projectType, records);
  return records;
}

export function updateProjectRecord(record: MultiProjectRecord): void {
  registry.set(record.projectId, record);
  invalidateProjectCaches(record.projectId, record.workspaceId, record.state, record.projectType);
  cacheProjectRecord(record);
  setCachedProjectById(record);
}

export function removeProject(projectId: string): boolean {
  const record = registry.get(projectId);
  if (!record) return false;

  registry.delete(projectId);
  removeWorkspaceMapping(projectId);
  removeProjectContext(projectId);
  invalidateProjectCaches(projectId, record.workspaceId, record.state, record.projectType);
  return true;
}

export function resetProjectRegistryForTests(): void {
  registry.clear();
}
