/**
 * Persistent Build Runtime Foundation — Workspace Hosting Foundation bridge.
 */

import { getWorkspace, listWorkspaces } from '../workspace-hosting/index.js';
import { getStoredPersistentBuild, listStoredPersistentBuilds, storePersistentBuild } from './persistent-build-store.js';
import { recordPersistentBuildHistoryEntry } from './persistent-build-history.js';
import type { PersistentBuild, PersistentBuildWorkspaceLink } from './persistent-build-types.js';
import { PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE } from './persistent-build-types.js';

export function linkBuildToWorkspace(buildId: string, workspaceId: string): PersistentBuildWorkspaceLink | null {
  const build = getStoredPersistentBuild(buildId);
  const workspace = getWorkspace(workspaceId);
  if (!build || !workspace) return null;

  const mismatch =
    workspace.workspaceOwner.projectId !== build.buildOwner.projectId ||
    workspace.workspaceOwner.runtimeId !== build.buildOwner.runtimeId;
  const link: PersistentBuildWorkspaceLink = {
    workspaceId,
    linkedAt: Date.now(),
    linkAuthority: PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePersistentBuild({
    ...build,
    buildWorkspaceLink: link,
    buildOwner: { ...build.buildOwner, workspaceId },
    buildRelationships: {
      ...build.buildRelationships,
      relatedWorkspaceIds: [...new Set([...build.buildRelationships.relatedWorkspaceIds, workspaceId])],
    },
    updatedAt: Date.now(),
  });

  recordPersistentBuildHistoryEntry({
    buildId,
    category: 'WORKSPACE',
    summary: `Linked to workspace ${workspaceId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: workspaceId,
  });

  return link;
}

export function getWorkspaceForBuild(buildId: string): string | null {
  return getStoredPersistentBuild(buildId)?.buildWorkspaceLink.workspaceId ?? null;
}

export function listBuildsByWorkspace(workspaceId: string): PersistentBuild[] {
  return listStoredPersistentBuilds().filter(
    (b) => b.buildWorkspaceLink.workspaceId === workspaceId || b.buildOwner.workspaceId === workspaceId,
  );
}

export function detectBuildWorkspaceMismatch(buildId: string): boolean {
  const build = getStoredPersistentBuild(buildId);
  if (!build) return true;
  const workspace = getWorkspace(build.buildWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return (
    workspace.workspaceOwner.projectId !== build.buildOwner.projectId ||
    workspace.workspaceOwner.runtimeId !== build.buildOwner.runtimeId ||
    build.buildWorkspaceLink.mismatchDetected
  );
}

export function resolveWorkspaceForBuildRegistration(
  workspaceId: string,
): { exists: boolean; projectId: string | null; runtimeId: string | null } {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return { exists: false, projectId: null, runtimeId: null };
  return {
    exists: true,
    projectId: workspace.workspaceOwner.projectId,
    runtimeId: workspace.workspaceOwner.runtimeId,
  };
}

export function listAvailableWorkspaceIdsForBuildBridge(): string[] {
  return listWorkspaces().map((w) => w.workspaceId);
}
