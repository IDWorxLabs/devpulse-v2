/**
 * Workspace Isolation Expansion — workspace ownership management.
 */

import {
  getCachedWorkspaceOwner,
  setCachedWorkspaceOwner,
} from './workspace-cache.js';

const workspaceOwners = new Map<string, string>();
const secondaryAuthorized = new Map<string, Set<string>>();

export function assignWorkspaceOwner(
  workspaceId: string,
  ownerProjectId: string,
): { ok: true } | { ok: false; error: string } {
  const existing = workspaceOwners.get(workspaceId);
  if (existing && existing !== ownerProjectId) {
    return { ok: false, error: `Workspace ${workspaceId} already owned by ${existing}` };
  }

  workspaceOwners.set(workspaceId, ownerProjectId);
  setCachedWorkspaceOwner(workspaceId, ownerProjectId);
  return { ok: true };
}

export function getWorkspaceOwner(workspaceId: string): string | undefined {
  const cached = getCachedWorkspaceOwner(workspaceId);
  if (cached) return cached;

  const owner = workspaceOwners.get(workspaceId);
  if (owner) setCachedWorkspaceOwner(workspaceId, owner);
  return owner;
}

export function addSecondaryAuthorizedAccess(workspaceId: string, projectId: string): void {
  const set = secondaryAuthorized.get(workspaceId) ?? new Set<string>();
  set.add(projectId);
  secondaryAuthorized.set(workspaceId, set);
}

export function getSecondaryAuthorizedAccess(workspaceId: string): string[] {
  return [...(secondaryAuthorized.get(workspaceId) ?? [])];
}

export function resetWorkspaceOwnershipForTests(): void {
  workspaceOwners.clear();
  secondaryAuthorized.clear();
}
