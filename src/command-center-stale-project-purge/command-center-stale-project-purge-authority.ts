/**
 * Command Center Stale Project Purge V1 — registry-authoritative purge authority.
 */

import {
  ACTIVE_PROJECT_LOCAL_STORAGE_KEYS,
  ACTIVE_PROJECT_SESSION_STORAGE_KEYS,
  COMMAND_CENTER_STALE_PROJECT_PURGE_TRACE,
  type CommandCenterClientProjectState,
  type CommandCenterProjectChip,
  type StaleProjectPurgePlan,
  type StaleProjectPurgeResult,
} from './command-center-stale-project-purge-types.js';

export function listRegistryProjectIds(
  projects: readonly { projectId: string }[] | null | undefined,
): string[] {
  if (!projects || !projects.length) return [];
  return projects.map((project) => project.projectId);
}

export function pruneProjectChipsAgainstRegistry(
  chips: readonly CommandCenterProjectChip[],
  registryProjectIds: readonly string[],
): CommandCenterProjectChip[] {
  if (!registryProjectIds.length) return [];
  const allowed = new Set(registryProjectIds);
  return chips.filter((chip) => allowed.has(chip.projectId));
}

export function resolveActiveProjectIdForRegistry(
  registryProjectIds: readonly string[],
  activeProjectId: string | null | undefined,
): string | null {
  if (!registryProjectIds.length) return null;
  if (activeProjectId && registryProjectIds.includes(activeProjectId)) return activeProjectId;
  return null;
}

export function buildWorkspaceChipsFromRegistryProjects(
  projects: readonly { projectId: string; name: string; buildState?: { status?: string } | null; buildStatus?: string; workspacePath?: string | null; previewUrl?: string | null; buildProfile?: string | null }[],
  activeProjectId: string | null,
): CommandCenterProjectChip[] {
  return projects.map((project) => ({
    projectId: project.projectId,
    projectName: project.name,
    active: project.projectId === activeProjectId,
    buildStatus: project.buildState?.status ?? project.buildStatus ?? 'IDLE',
    workspacePath: project.workspacePath ?? null,
    previewUrl: project.previewUrl ?? null,
    buildProfile: project.buildProfile ?? null,
  }));
}

export function planStaleCommandCenterProjectPurge(input: {
  registryProjects: readonly { projectId: string; name: string }[];
  state: CommandCenterClientProjectState;
  reason: string;
}): StaleProjectPurgePlan {
  const registryProjectIds = listRegistryProjectIds(input.registryProjects);
  const allowed = new Set(registryProjectIds);
  const staleChipProjectIds = input.state.multiProjectWorkspaces
    .filter((chip) => !allowed.has(chip.projectId))
    .map((chip) => chip.projectId);
  const activeProjectNotInRegistry = Boolean(
    input.state.activeProjectId && !allowed.has(input.state.activeProjectId),
  );
  const registryEmpty = registryProjectIds.length === 0;
  const shouldPurge =
    registryEmpty ||
    staleChipProjectIds.length > 0 ||
    activeProjectNotInRegistry ||
    Boolean(input.state.activeProjectName && registryEmpty) ||
    Boolean(input.state.activeProjectStatus && registryEmpty);

  return {
    readOnly: true,
    shouldPurge,
    reason: input.reason,
    registryProjectIds,
    staleChipProjectIds,
    activeProjectNotInRegistry,
    registryEmpty,
    storageKeysToClear: registryEmpty || staleChipProjectIds.length > 0 || activeProjectNotInRegistry
      ? [...ACTIVE_PROJECT_LOCAL_STORAGE_KEYS, ...ACTIVE_PROJECT_SESSION_STORAGE_KEYS]
      : [],
  };
}

export function applyStaleCommandCenterProjectPurge(input: {
  registryProjects: readonly { projectId: string; name: string; buildState?: { status?: string } | null; buildStatus?: string; workspacePath?: string | null; previewUrl?: string | null; buildProfile?: string | null }[];
  state: CommandCenterClientProjectState;
  reason: string;
  clearStorage?: (keys: readonly string[]) => void;
}): { state: CommandCenterClientProjectState; result: StaleProjectPurgeResult | null } {
  const plan = planStaleCommandCenterProjectPurge({
    registryProjects: input.registryProjects,
    state: input.state,
    reason: input.reason,
  });

  if (!plan.shouldPurge) {
    const resolvedActive = resolveActiveProjectIdForRegistry(
      plan.registryProjectIds,
      input.state.activeProjectId,
    );
    return {
      state: {
        ...input.state,
        activeProjectId: resolvedActive,
        multiProjectWorkspaces: buildWorkspaceChipsFromRegistryProjects(
          input.registryProjects,
          resolvedActive,
        ),
      },
      result: null,
    };
  }

  const previousActive = input.state.activeProjectId;
  const clearedChipCount = input.state.multiProjectWorkspaces.length;
  const nextState: CommandCenterClientProjectState = {
    activeProjectId: null,
    activeProjectName: null,
    activeProjectStatus: null,
    multiProjectWorkspaces: buildWorkspaceChipsFromRegistryProjects(input.registryProjects, null),
    projectChatThreads: plan.registryEmpty ? {} : { ...input.state.projectChatThreads },
  };

  if (plan.registryProjectIds.length > 0) {
    const resolvedActive = resolveActiveProjectIdForRegistry(
      plan.registryProjectIds,
      previousActive,
    );
    nextState.activeProjectId = resolvedActive;
    nextState.multiProjectWorkspaces = buildWorkspaceChipsFromRegistryProjects(
      input.registryProjects,
      resolvedActive,
    );
    if (resolvedActive) {
      const activeProject = input.registryProjects.find((project) => project.projectId === resolvedActive);
      nextState.activeProjectName = activeProject?.name ?? null;
      nextState.activeProjectStatus =
        (activeProject as { buildState?: { status?: string } } | undefined)?.buildState?.status ??
        (activeProject as { buildStatus?: string } | undefined)?.buildStatus ??
        null;
    }
  }

  if (input.clearStorage && plan.storageKeysToClear.length > 0) {
    input.clearStorage(plan.storageKeysToClear);
  }

  return {
    state: nextState,
    result: {
      readOnly: true,
      purged: true,
      trace: COMMAND_CENTER_STALE_PROJECT_PURGE_TRACE,
      reason: input.reason,
      clearedChipCount: plan.registryEmpty ? clearedChipCount : plan.staleChipProjectIds.length,
      clearedActiveProjectId: previousActive,
      clearedStorageKeys: plan.storageKeysToClear,
    },
  };
}
