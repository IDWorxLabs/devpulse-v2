/**
 * Multi Project Foundation — project identity generation.
 */

import type { ProjectIdentity } from './multi-project-types.js';

const usedProjectIds = new Set<string>();
const usedWorkspaceIds = new Set<string>();
const usedHandles = new Set<string>();

let identityCounter = 0;

export function createProjectIdentity(projectName: string): ProjectIdentity {
  identityCounter += 1;
  const projectId = `WORLD2_PROJECT_${String(identityCounter).padStart(6, '0')}`;

  identityCounter += 1;
  const workspaceId = `WORLD2_WORKSPACE_${String(identityCounter).padStart(6, '0')}`;

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  let projectHandle = `${slug}-${projectId.slice(-6)}`;
  let handleSuffix = 0;
  while (usedHandles.has(projectHandle)) {
    handleSuffix += 1;
    projectHandle = `${slug}-${projectId.slice(-6)}-${handleSuffix}`;
  }

  usedProjectIds.add(projectId);
  usedWorkspaceIds.add(workspaceId);
  usedHandles.add(projectHandle);

  return { projectId, workspaceId, projectHandle };
}

export function isProjectIdAvailable(projectId: string): boolean {
  return !usedProjectIds.has(projectId);
}

export function reserveProjectIdentity(identity: ProjectIdentity): void {
  usedProjectIds.add(identity.projectId);
  usedWorkspaceIds.add(identity.workspaceId);
  usedHandles.add(identity.projectHandle);
}

export function resetProjectIdentityForTests(): void {
  usedProjectIds.clear();
  usedWorkspaceIds.clear();
  usedHandles.clear();
  identityCounter = 0;
}
