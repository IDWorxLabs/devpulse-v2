/**
 * Registry Sovereignty V1 — activeProjectId must reference USER projects only.
 */

import type { ProjectRegistryFile } from '../project-registry-v1/project-registry-v1-types.js';
import { classifyRegistryProject } from './registry-classifier.js';

export function repairUserActiveProjectId(state: ProjectRegistryFile): string | null {
  const activeUserProjects = state.projects.filter(
    (project) => project.status === 'ACTIVE' && classifyRegistryProject(project) === 'USER',
  );
  if (!activeUserProjects.length) {
    state.activeProjectId = null;
    return null;
  }

  const current = state.activeProjectId
    ? state.projects.find((project) => project.projectId === state.activeProjectId)
    : null;

  if (
    current &&
    current.status === 'ACTIVE' &&
    classifyRegistryProject(current) === 'USER'
  ) {
    return current.projectId;
  }

  const next = activeUserProjects
    .slice()
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))[0]!;
  state.activeProjectId = next.projectId;
  return next.projectId;
}
