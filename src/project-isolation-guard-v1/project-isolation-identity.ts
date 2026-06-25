/**
 * Project Isolation Guard V1 — resolve project identity (no circular imports).
 */

import { getProjectSession } from '../one-prompt-live-preview/workspace-tab-registry.js';
import { getProjectContextMetadata } from '../project-context-alignment-v1/project-context-metadata-store.js';
import { readProjectRegistryState } from '../project-registry-v1/project-registry-v1-store.js';
import { workspacePathForProject } from './project-isolation-read-filter.js';
import type { ProjectIdentityRecord } from './project-isolation-guard-types.js';

export function resolveProjectIdentity(
  projectId: string,
  rootDir?: string,
): ProjectIdentityRecord | null {
  const registry = readProjectRegistryState(rootDir);
  const record = registry.projects.find(
    (project) => project.projectId === projectId && project.status === 'ACTIVE',
  );
  if (!record) return null;

  const metadata = getProjectContextMetadata(projectId, rootDir);
  const session = getProjectSession(projectId);

  return {
    readOnly: true,
    projectId: record.projectId,
    projectName: record.name,
    createdAt: record.createdAt,
    projectDomain: metadata?.domain ?? 'general application',
    projectProfile: metadata?.profile ?? null,
    workspacePath: session?.workspacePath ?? workspacePathForProject(projectId),
  };
}

export function listProjectIdentities(rootDir?: string): ProjectIdentityRecord[] {
  const registry = readProjectRegistryState(rootDir);
  return registry.projects
    .filter((project) => project.status === 'ACTIVE')
    .map((project) => resolveProjectIdentity(project.projectId, rootDir))
    .filter((identity): identity is ProjectIdentityRecord => identity !== null);
}
