/**
 * Workspace Isolation Expansion — workspace registry.
 */

import type {
  RegisterWorkspaceInput,
  WorkspaceIsolationStatus,
  WorkspaceRecord,
  WorkspaceState,
} from './workspace-isolation-types.js';
import {
  getCachedWorkspace,
  getCachedWorkspacesByIsolation,
  getCachedWorkspacesByOwner,
  getCachedWorkspacesByState,
  invalidateWorkspaceCaches,
  setCachedWorkspace,
  setCachedWorkspacesByIsolation,
  setCachedWorkspacesByOwner,
  setCachedWorkspacesByState,
} from './workspace-cache.js';

const registry = new Map<string, WorkspaceRecord>();

export function registerWorkspace(input: RegisterWorkspaceInput): WorkspaceRecord {
  const now = Date.now();
  const record: WorkspaceRecord = {
    workspaceId: input.workspaceId,
    ownerProjectId: input.ownerProjectId,
    state: 'ACTIVE',
    isolationStatus: 'ISOLATED',
    createdAt: now,
    updatedAt: now,
  };

  registry.set(record.workspaceId, record);
  setCachedWorkspace(record);
  return record;
}

export function getWorkspaceRecord(workspaceId: string): WorkspaceRecord | undefined {
  const cached = getCachedWorkspace(workspaceId);
  if (cached) return cached;

  const record = registry.get(workspaceId);
  if (record) setCachedWorkspace(record);
  return record;
}

export function listWorkspaces(): WorkspaceRecord[] {
  return [...registry.values()];
}

export function getWorkspaceRegistrySize(): number {
  return registry.size;
}

export function listWorkspacesByOwner(ownerProjectId: string): WorkspaceRecord[] {
  const cached = getCachedWorkspacesByOwner(ownerProjectId);
  if (cached) return cached;

  const records = [...registry.values()].filter((r) => r.ownerProjectId === ownerProjectId);
  setCachedWorkspacesByOwner(ownerProjectId, records);
  return records;
}

export function listWorkspacesByState(state: WorkspaceState): WorkspaceRecord[] {
  const cached = getCachedWorkspacesByState(state);
  if (cached) return cached;

  const records = [...registry.values()].filter((r) => r.state === state);
  setCachedWorkspacesByState(state, records);
  return records;
}

export function listWorkspacesByIsolationStatus(status: WorkspaceIsolationStatus): WorkspaceRecord[] {
  const cached = getCachedWorkspacesByIsolation(status);
  if (cached) return cached;

  const records = [...registry.values()].filter((r) => r.isolationStatus === status);
  setCachedWorkspacesByIsolation(status, records);
  return records;
}

export function updateWorkspaceRecord(record: WorkspaceRecord): void {
  registry.set(record.workspaceId, record);
  invalidateWorkspaceCaches(record.workspaceId, record.ownerProjectId);
  setCachedWorkspace(record);
}

export function removeWorkspace(workspaceId: string): boolean {
  const record = registry.get(workspaceId);
  if (!record) return false;
  registry.delete(workspaceId);
  invalidateWorkspaceCaches(workspaceId, record.ownerProjectId);
  return true;
}

export function resetWorkspaceRegistryForTests(): void {
  registry.clear();
}
