/**
 * Workspace Isolation Expansion — workspace access control.
 */

import type { WorkspaceAccessResult } from './workspace-isolation-types.js';
import { getWorkspaceOwner, getSecondaryAuthorizedAccess } from './workspace-ownership-manager.js';
import { getWorkspaceBoundary } from './workspace-boundary-manager.js';
import {
  getCachedAccessGrant,
  setCachedAccessGrant,
} from './workspace-cache.js';

const revokedAccess = new Set<string>();

function accessKey(workspaceId: string, projectId: string): string {
  return `${workspaceId}:${projectId}`;
}

export function requestWorkspaceAccess(
  workspaceId: string,
  projectId: string,
): WorkspaceAccessResult {
  const cacheKey = accessKey(workspaceId, projectId);
  const cached = getCachedAccessGrant(cacheKey);
  if (cached === true) return 'ACCESS_GRANTED';
  if (cached === false) return 'ACCESS_DENIED';

  if (revokedAccess.has(cacheKey)) {
    setCachedAccessGrant(cacheKey, false);
    return 'ACCESS_DENIED';
  }

  const owner = getWorkspaceOwner(workspaceId);
  if (!owner) return 'ACCESS_DENIED';

  if (projectId === owner) {
    setCachedAccessGrant(cacheKey, true);
    return 'ACCESS_GRANTED';
  }

  const secondary = getSecondaryAuthorizedAccess(workspaceId);
  if (secondary.includes(projectId)) {
    setCachedAccessGrant(cacheKey, true);
    return 'ACCESS_GRANTED';
  }

  const boundary = getWorkspaceBoundary(workspaceId);
  if (boundary?.permittedAccess.includes(projectId)) {
    setCachedAccessGrant(cacheKey, true);
    return 'ACCESS_GRANTED';
  }

  return 'ACCESS_REQUIRES_AUTHORIZATION';
}

export function validateWorkspaceAccess(
  workspaceId: string,
  projectId: string,
): WorkspaceAccessResult {
  return requestWorkspaceAccess(workspaceId, projectId);
}

export function grantWorkspaceAccess(workspaceId: string, projectId: string): void {
  revokedAccess.delete(accessKey(workspaceId, projectId));
  setCachedAccessGrant(accessKey(workspaceId, projectId), true);
}

export function revokeWorkspaceAccess(workspaceId: string, projectId: string): void {
  revokedAccess.add(accessKey(workspaceId, projectId));
  setCachedAccessGrant(accessKey(workspaceId, projectId), false);
}

export function resetWorkspaceAccessForTests(): void {
  revokedAccess.clear();
}
