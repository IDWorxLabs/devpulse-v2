/**
 * Multi Project Foundation — project workspace mapping.
 */

import type { MultiProjectRecord } from './multi-project-types.js';

const workspaceToProject = new Map<string, string>();
const projectToWorkspace = new Map<string, string>();

export function assignWorkspace(projectId: string, workspaceId: string): { ok: true } | { ok: false; error: string } {
  const existing = workspaceToProject.get(workspaceId);
  if (existing && existing !== projectId) {
    return { ok: false, error: `Workspace ${workspaceId} already mapped to ${existing}` };
  }

  workspaceToProject.set(workspaceId, projectId);
  projectToWorkspace.set(projectId, workspaceId);
  return { ok: true };
}

export function getWorkspace(projectId: string): string | undefined {
  return projectToWorkspace.get(projectId);
}

export function getProjectForWorkspace(workspaceId: string): string | undefined {
  return workspaceToProject.get(workspaceId);
}

export function listWorkspaceMappings(): Array<{ projectId: string; workspaceId: string }> {
  return [...projectToWorkspace.entries()].map(([projectId, workspaceId]) => ({ projectId, workspaceId }));
}

export function removeWorkspaceMapping(projectId: string): void {
  const workspaceId = projectToWorkspace.get(projectId);
  if (workspaceId) {
    workspaceToProject.delete(workspaceId);
  }
  projectToWorkspace.delete(projectId);
}

export function registerWorkspaceFromRecord(record: MultiProjectRecord): { ok: true } | { ok: false; error: string } {
  return assignWorkspace(record.projectId, record.workspaceId);
}

export function resetProjectWorkspaceMapperForTests(): void {
  workspaceToProject.clear();
  projectToWorkspace.clear();
}
