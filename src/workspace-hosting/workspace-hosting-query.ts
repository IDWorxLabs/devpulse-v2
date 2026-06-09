/**
 * Workspace Hosting Foundation — query layer.
 */

import { listStoredWorkspaces, listStoredWorkspaceSessions } from './workspace-hosting-store.js';
import type { HostedWorkspace, WorkspaceCategory } from './workspace-hosting-types.js';

export interface WorkspaceQuery {
  projectId?: string;
  runtimeId?: string;
  ownerModule?: string;
  workspaceType?: WorkspaceCategory;
  workspaceState?: HostedWorkspace['workspaceState'];
  resumable?: boolean;
  isolated?: boolean;
}

export function queryWorkspaces(query: WorkspaceQuery = {}): HostedWorkspace[] {
  return listStoredWorkspaces().filter((workspace) => {
    if (query.projectId && workspace.workspaceOwner.projectId !== query.projectId) return false;
    if (query.runtimeId && workspace.workspaceOwner.runtimeId !== query.runtimeId) return false;
    if (query.ownerModule && workspace.workspaceOwner.ownerModule !== query.ownerModule) return false;
    if (query.workspaceType && workspace.workspaceType !== query.workspaceType) return false;
    if (query.workspaceState && workspace.workspaceState !== query.workspaceState) return false;
    if (query.resumable !== undefined && workspace.workspaceMetadata.resumable !== query.resumable) return false;
    if (query.isolated !== undefined && (workspace.workspaceState === 'ISOLATED') !== query.isolated) return false;
    return true;
  });
}

export function listWorkspaces(): HostedWorkspace[] {
  return listStoredWorkspaces();
}

export function listWorkspacesByProject(projectId: string): HostedWorkspace[] {
  return queryWorkspaces({ projectId });
}

export function listWorkspacesByRuntime(runtimeId: string): HostedWorkspace[] {
  return queryWorkspaces({ runtimeId });
}

export function listWorkspacesByOwner(ownerModule: string): HostedWorkspace[] {
  return queryWorkspaces({ ownerModule });
}

export function listWorkspacesByType(workspaceType: WorkspaceCategory): HostedWorkspace[] {
  return queryWorkspaces({ workspaceType });
}

export function countWorkspacesByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const workspace of listStoredWorkspaces()) {
    counts[workspace.workspaceState] = (counts[workspace.workspaceState] ?? 0) + 1;
  }
  return counts;
}

export function countWorkspaceSessions(): number {
  return listStoredWorkspaceSessions().length;
}
