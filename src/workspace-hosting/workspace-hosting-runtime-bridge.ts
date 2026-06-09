/**
 * Workspace Hosting Foundation — Cloud Runtime Foundation bridge.
 * Does not create runtime authority — Cloud Runtime Foundation remains source of truth.
 */

import { getRuntime, listRuntimes } from '../cloud-runtime/index.js';
import { getStoredWorkspace, listStoredWorkspaces, storeWorkspace } from './workspace-hosting-store.js';
import { recordWorkspaceHistoryEntry } from './workspace-hosting-history.js';
import type { HostedWorkspace, WorkspaceRuntimeLink } from './workspace-hosting-types.js';
import { WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE } from './workspace-hosting-types.js';

export function linkWorkspaceToRuntime(workspaceId: string, runtimeId: string): WorkspaceRuntimeLink | null {
  const workspace = getStoredWorkspace(workspaceId);
  const runtime = getRuntime(runtimeId);
  if (!workspace || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== workspace.workspaceOwner.projectId;
  const link: WorkspaceRuntimeLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeWorkspace({
    ...workspace,
    workspaceRuntimeLink: link,
    workspaceOwner: {
      ...workspace.workspaceOwner,
      runtimeId,
    },
    workspaceRelationships: {
      ...workspace.workspaceRelationships,
      relatedRuntimeIds: [...new Set([...workspace.workspaceRelationships.relatedRuntimeIds, runtimeId])],
    },
    updatedAt: Date.now(),
  });

  recordWorkspaceHistoryEntry({
    workspaceId,
    category: 'RUNTIME',
    summary: `Linked to runtime ${runtimeId}${mismatch ? ' — MISMATCH detected' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getRuntimeForWorkspace(workspaceId: string): string | null {
  const workspace = getStoredWorkspace(workspaceId);
  if (!workspace) return null;
  return workspace.workspaceRuntimeLink.runtimeId;
}

export function listWorkspacesByRuntime(runtimeId: string): HostedWorkspace[] {
  return listStoredWorkspaces().filter(
    (w) => w.workspaceRuntimeLink.runtimeId === runtimeId || w.workspaceOwner.runtimeId === runtimeId,
  );
}

export function detectRuntimeWorkspaceMismatch(workspaceId: string): boolean {
  const workspace = getStoredWorkspace(workspaceId);
  if (!workspace) return true;

  const runtimeId = workspace.workspaceRuntimeLink.runtimeId;
  const runtime = getRuntime(runtimeId);
  if (!runtime) return true;

  const projectMismatch = runtime.runtimeOwner.projectId !== workspace.workspaceOwner.projectId;
  const linkMismatch = workspace.workspaceRuntimeLink.mismatchDetected;
  return projectMismatch || linkMismatch;
}

export function listAvailableRuntimeIdsForBridge(): string[] {
  return listRuntimes().map((r) => r.runtimeId);
}

export function resolveRuntimeForRegistration(runtimeId: string): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}
