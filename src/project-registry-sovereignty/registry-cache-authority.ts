/**
 * Registry Sovereignty V1 — user workspace cache and tab sovereignty.
 */

import {
  pruneWorkspaceSessionsNotInRegistry,
  setActiveProjectId,
} from '../one-prompt-live-preview/workspace-tab-registry.js';
import {
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
} from '../project-registry-v1/project-registry-v1-store.js';
import { classifyRegistryProject } from './registry-classifier.js';
import { resolveUserRegistryRoot } from './registry-tier-paths.js';

export function listUserFacingActiveProjectIds(rootDir?: string): string[] {
  const userState = readProjectRegistryState(resolveUserRegistryRoot(rootDir));
  return userState.projects
    .filter((project) => project.status === 'ACTIVE' && classifyRegistryProject(project) === 'USER')
    .map((project) => project.projectId);
}

export function rebuildUserWorkspaceCache(rootDir?: string): void {
  const userState = readProjectRegistryState(resolveUserRegistryRoot(rootDir));
  const userActiveIds = listUserFacingActiveProjectIds(rootDir);
  pruneWorkspaceSessionsNotInRegistry(userActiveIds);

  if (userState.activeProjectId && userActiveIds.includes(userState.activeProjectId)) {
    setActiveProjectId(userState.activeProjectId);
  } else if (userActiveIds[0]) {
    setActiveProjectId(userActiveIds[0]);
  }

  invalidateProjectRegistryV1Cache();
}
