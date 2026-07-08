/**
 * Project State Sync V1 — single source of truth for registry-driven client state.
 */

import type {
  ProjectRegistryProjectRecord,
  ProjectStateSnapshot,
  ProjectWorkspaceChip,
  RegistryPayloadLike,
} from './project-state-sync-types.js';

export function resolveRegistryActiveProjectId(payload: RegistryPayloadLike | null | undefined): string | null {
  if (!payload) return null;
  if (payload.activeProjectId) return payload.activeProjectId;
  if (payload.projects && !Array.isArray(payload.projects) && payload.projects.activeProjectId) {
    return payload.projects.activeProjectId;
  }
  if (payload.registry?.activeProjectId) return payload.registry.activeProjectId;
  return null;
}

export function listRegistryProjects(payload: RegistryPayloadLike): ProjectRegistryProjectRecord[] {
  const projectsField = payload.projects;
  if (Array.isArray(projectsField)) {
    return projectsField;
  }
  if (projectsField && Array.isArray(projectsField.items)) {
    return projectsField.items;
  }
  if (Array.isArray(payload.registry?.projects)) {
    return payload.registry.projects;
  }
  return [];
}

export function buildWorkspaceChipsFromRegistry(
  projects: readonly ProjectRegistryProjectRecord[],
  activeProjectId: string | null,
): ProjectWorkspaceChip[] {
  return projects.map((project) => ({
    projectId: project.projectId,
    projectName: project.name,
    active: project.projectId === activeProjectId,
    buildStatus: project.buildStatus ?? 'IDLE',
    workspacePath: project.workspacePath ?? null,
    previewUrl: project.previewUrl ?? null,
  }));
}

export function pruneWorkspaceChips(
  chips: readonly ProjectWorkspaceChip[],
  registryProjectIds: readonly string[],
): ProjectWorkspaceChip[] {
  const allowed = new Set(registryProjectIds);
  return chips.filter((chip) => allowed.has(chip.projectId));
}

export function applyRegistryPayloadToProjectState(input: {
  previous: ProjectStateSnapshot;
  payload: RegistryPayloadLike;
}): ProjectStateSnapshot {
  const projects = listRegistryProjects(input.payload);
  const activeProjectId = resolveRegistryActiveProjectId(input.payload);
  const registryIds = projects.map((p) => p.projectId);

  let chips: ProjectWorkspaceChip[];
  if (Array.isArray(input.payload.multiProjectWorkspaces) && input.payload.multiProjectWorkspaces.length) {
    chips = pruneWorkspaceChips(input.payload.multiProjectWorkspaces, registryIds).map((chip) => ({
      ...chip,
      active: chip.projectId === activeProjectId,
    }));
  } else {
    chips = buildWorkspaceChipsFromRegistry(projects, activeProjectId);
  }

  const resolvedActive =
    activeProjectId && registryIds.includes(activeProjectId) ? activeProjectId : chips[0]?.projectId ?? null;

  return {
    readOnly: true,
    activeProjectId: resolvedActive,
    projects,
    multiProjectWorkspaces: chips.map((chip) => ({
      ...chip,
      active: chip.projectId === resolvedActive,
    })),
    hydrationState: projects.length === 0 ? 'empty' : 'ready',
  };
}

export function shouldClearActiveProjectAfterDelete(input: {
  deletedProjectId: string;
  previousActiveProjectId: string | null;
  nextActiveProjectId: string | null;
}): boolean {
  return input.previousActiveProjectId === input.deletedProjectId && !input.nextActiveProjectId;
}
