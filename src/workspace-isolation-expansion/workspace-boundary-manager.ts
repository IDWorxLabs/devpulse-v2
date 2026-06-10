/**
 * Workspace Isolation Expansion — workspace boundary management.
 */

import type { WorkspaceBoundary, WorkspaceIsolationStatus } from './workspace-isolation-types.js';

const boundaries = new Map<string, WorkspaceBoundary>();

export function createWorkspaceBoundary(
  workspaceId: string,
  ownerProjectId: string,
  permittedAccess: string[] = [],
): WorkspaceBoundary {
  const boundary: WorkspaceBoundary = {
    workspaceId,
    ownerProjectId,
    permittedAccess: [ownerProjectId, ...permittedAccess.filter((p) => p !== ownerProjectId)],
    isolationStatus: permittedAccess.length > 0 ? 'SHARED_AUTHORIZED' : 'ISOLATED',
    createdAt: Date.now(),
  };
  boundaries.set(workspaceId, boundary);
  return boundary;
}

export function getWorkspaceBoundary(workspaceId: string): WorkspaceBoundary | undefined {
  return boundaries.get(workspaceId);
}

export function validateWorkspaceBoundary(workspaceId: string, ownerProjectId: string): {
  valid: boolean;
  isolationStatus: WorkspaceIsolationStatus;
  violations: string[];
} {
  const boundary = boundaries.get(workspaceId);
  if (!boundary) {
    return { valid: false, isolationStatus: 'ISOLATION_VIOLATION', violations: ['boundary not defined'] };
  }

  const violations: string[] = [];
  if (boundary.ownerProjectId !== ownerProjectId) {
    violations.push('owner mismatch');
  }
  if (!boundary.permittedAccess.includes(ownerProjectId)) {
    violations.push('owner not in permitted access');
  }

  return {
    valid: violations.length === 0,
    isolationStatus: violations.length > 0 ? 'ISOLATION_VIOLATION' : boundary.isolationStatus,
    violations,
  };
}

export function addPermittedAccess(workspaceId: string, projectId: string): void {
  const boundary = boundaries.get(workspaceId);
  if (!boundary) return;
  if (!boundary.permittedAccess.includes(projectId)) {
    boundary.permittedAccess.push(projectId);
    boundary.isolationStatus = boundary.permittedAccess.length > 1 ? 'SHARED_AUTHORIZED' : 'ISOLATED';
  }
}

export function removePermittedAccess(workspaceId: string, projectId: string): void {
  const boundary = boundaries.get(workspaceId);
  if (!boundary || projectId === boundary.ownerProjectId) return;
  boundary.permittedAccess = boundary.permittedAccess.filter((p) => p !== projectId);
  boundary.isolationStatus = boundary.permittedAccess.length <= 1 ? 'ISOLATED' : 'SHARED_AUTHORIZED';
}

export function resetWorkspaceBoundariesForTests(): void {
  boundaries.clear();
}
