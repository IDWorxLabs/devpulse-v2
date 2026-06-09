/**
 * Workspace Hosting Foundation — isolation metadata (no real containers).
 */

import { getStoredWorkspace, storeWorkspace } from './workspace-hosting-store.js';
import { recordWorkspaceHistoryEntry } from './workspace-hosting-history.js';
import type { WorkspaceIsolation, WorkspaceIsolationMode } from './workspace-hosting-types.js';
import { WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE } from './workspace-hosting-types.js';

export function buildDefaultIsolation(input: {
  projectId: string;
  runtimeId: string;
  mode?: WorkspaceIsolationMode;
  disposable?: boolean;
}): WorkspaceIsolation {
  return {
    isolationMode: input.mode ?? 'PROJECT_BOUND',
    isolationBoundary: `${input.projectId}:${input.runtimeId}`,
    allowedRuntimeIds: [input.runtimeId],
    allowedProjectIds: [input.projectId],
    allowedSessionIds: [],
    disposableWorkspace: input.disposable ?? false,
    stableWorkspaceProtected: true,
    crossProjectAccessBlocked: true,
  };
}

export function applyWorkspaceIsolation(
  workspaceId: string,
  mode: WorkspaceIsolationMode = 'STRICT',
): WorkspaceIsolation | null {
  const workspace = getStoredWorkspace(workspaceId);
  if (!workspace) return null;

  const isolation: WorkspaceIsolation = {
    ...workspace.workspaceIsolation,
    isolationMode: mode,
    isolationBoundary: `${workspace.workspaceOwner.projectId}:${workspace.workspaceOwner.runtimeId}:${mode}`,
    crossProjectAccessBlocked: true,
    stableWorkspaceProtected: mode !== 'SANDBOX',
    disposableWorkspace: mode === 'SANDBOX',
  };

  storeWorkspace({
    ...workspace,
    workspaceIsolation: isolation,
    workspaceState: 'ISOLATED',
    workspaceStatus: 'ISOLATED',
    updatedAt: Date.now(),
  });

  recordWorkspaceHistoryEntry({
    workspaceId,
    category: 'ISOLATION',
    summary: `Isolation applied: mode=${mode} boundary=${isolation.isolationBoundary}`,
    scopeUsed: mode,
  });

  return isolation;
}

export function evaluateIsolationBoundaryRisk(workspaceId: string): string[] {
  const workspace = getStoredWorkspace(workspaceId);
  if (!workspace) return ['Missing workspace for isolation evaluation'];

  const risks: string[] = [];
  const iso = workspace.workspaceIsolation;

  if (!iso.crossProjectAccessBlocked) {
    risks.push('Cross-project access not blocked — isolation boundary risk');
  }
  if (iso.allowedProjectIds.length > 1) {
    risks.push('Multiple allowed project ids — cross-project access risk');
  }
  if (
    workspace.workspaceOwner.runtimeId &&
    !iso.allowedRuntimeIds.includes(workspace.workspaceOwner.runtimeId)
  ) {
    risks.push('Runtime id not in allowed runtime list — isolation boundary mismatch');
  }
  if (iso.isolationMode === 'NONE') {
    risks.push('Isolation mode NONE — boundary not enforced at metadata level');
  }

  return risks;
}

export function getWorkspaceIsolation(workspaceId: string): WorkspaceIsolation | null {
  return getStoredWorkspace(workspaceId)?.workspaceIsolation ?? null;
}

export function isolationAuthorityNote(): string {
  return `${WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE} — isolation metadata only, no containers`;
}
