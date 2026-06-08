/**
 * Workspace identity — deterministic workspace and project identity.
 */

import type { Workspace, WorkspaceCreateInput } from './types.js';

let workspaceCounter = 0;

export function resetWorkspaceIdentityCounterForTests(): void {
  workspaceCounter = 0;
}

function createWorkspaceId(): string {
  workspaceCounter += 1;
  return `world2-ws-${workspaceCounter.toString().padStart(4, '0')}`;
}

export function normalizeProjectId(projectId: string): string {
  return projectId.trim().toLowerCase().replace(/\s+/g, '-');
}

export function buildWorkspaceIdentity(input: WorkspaceCreateInput): Pick<Workspace, 'workspaceId' | 'projectId' | 'projectName' | 'projectVision'> {
  return {
    workspaceId: createWorkspaceId(),
    projectId: normalizeProjectId(input.projectId),
    projectName: input.projectName.trim(),
    projectVision: input.projectVision.trim(),
  };
}

export function identityKey(workspace: Pick<Workspace, 'workspaceId' | 'projectId'>): string {
  return `${workspace.workspaceId}|${workspace.projectId}`;
}

export function isValidWorkspaceId(workspaceId: string): boolean {
  return workspaceId.startsWith('world2-ws-') && workspaceId.length > 10;
}
