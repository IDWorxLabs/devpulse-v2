/**
 * Persistent Build Runtime Foundation — query layer.
 */

import { listStoredPersistentBuilds, listStoredPersistentBuildSessions } from './persistent-build-store.js';
import type { PersistentBuild, PersistentBuildCategory } from './persistent-build-types.js';

export interface PersistentBuildQuery {
  projectId?: string;
  workspaceId?: string;
  runtimeId?: string;
  ownerModule?: string;
  buildType?: PersistentBuildCategory;
  buildState?: PersistentBuild['buildState'];
  resumable?: boolean;
  pausable?: boolean;
}

export function queryPersistentBuilds(query: PersistentBuildQuery = {}): PersistentBuild[] {
  return listStoredPersistentBuilds().filter((build) => {
    if (query.projectId && build.buildOwner.projectId !== query.projectId) return false;
    if (query.workspaceId && build.buildOwner.workspaceId !== query.workspaceId) return false;
    if (query.runtimeId && build.buildOwner.runtimeId !== query.runtimeId) return false;
    if (query.ownerModule && build.buildOwner.ownerModule !== query.ownerModule) return false;
    if (query.buildType && build.buildType !== query.buildType) return false;
    if (query.buildState && build.buildState !== query.buildState) return false;
    if (query.resumable !== undefined && build.buildMetadata.resumable !== query.resumable) return false;
    if (query.pausable !== undefined && build.buildMetadata.pausable !== query.pausable) return false;
    return true;
  });
}

export function listPersistentBuilds(): PersistentBuild[] {
  return listStoredPersistentBuilds();
}

export function listPersistentBuildsByProject(projectId: string): PersistentBuild[] {
  return queryPersistentBuilds({ projectId });
}

export function listPersistentBuildsByWorkspace(workspaceId: string): PersistentBuild[] {
  return queryPersistentBuilds({ workspaceId });
}

export function listPersistentBuildsByRuntime(runtimeId: string): PersistentBuild[] {
  return queryPersistentBuilds({ runtimeId });
}

export function listPersistentBuildsByOwner(ownerModule: string): PersistentBuild[] {
  return queryPersistentBuilds({ ownerModule });
}

export function listPersistentBuildsByType(buildType: PersistentBuildCategory): PersistentBuild[] {
  return queryPersistentBuilds({ buildType });
}

export function countBuildsByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const build of listStoredPersistentBuilds()) {
    counts[build.buildState] = (counts[build.buildState] ?? 0) + 1;
  }
  return counts;
}

export function countBuildSessions(): number {
  return listStoredPersistentBuildSessions().length;
}
