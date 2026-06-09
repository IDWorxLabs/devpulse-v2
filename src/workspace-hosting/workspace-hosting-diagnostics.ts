/**
 * Workspace Hosting Foundation — diagnostics tracker.
 */

import { listStoredWorkspaces, listStoredWorkspaceSessions } from './workspace-hosting-store.js';
import { detectRuntimeWorkspaceMismatch } from './workspace-hosting-runtime-bridge.js';
import type { WorkspaceHostingDiagnostics, WorkspaceState } from './workspace-hosting-types.js';

let diagnostics: WorkspaceHostingDiagnostics = {
  workspaceHostingAuthorityActive: false,
  registeredWorkspaceCount: 0,
  activeSessionCount: 0,
  readyWorkspaceCount: 0,
  isolatedWorkspaceCount: 0,
  blockedWorkspaceCount: 0,
  duplicateRiskCount: 0,
  runtimeMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getWorkspaceHostingDiagnostics(): WorkspaceHostingDiagnostics {
  return { ...diagnostics };
}

export function updateWorkspaceHostingDiagnostics(
  query: string,
  state: WorkspaceState | null,
  duplicateRiskCount = 0,
): void {
  const workspaces = listStoredWorkspaces();
  const sessions = listStoredWorkspaceSessions();
  let mismatchCount = 0;
  for (const w of workspaces) {
    if (detectRuntimeWorkspaceMismatch(w.workspaceId)) mismatchCount += 1;
  }

  diagnostics = {
    workspaceHostingAuthorityActive: workspaces.length > 0,
    registeredWorkspaceCount: workspaces.length,
    activeSessionCount: sessions.length,
    readyWorkspaceCount: workspaces.filter((w) => w.workspaceState === 'READY' || w.workspaceState === 'ACTIVE').length,
    isolatedWorkspaceCount: workspaces.filter((w) => w.workspaceState === 'ISOLATED').length,
    blockedWorkspaceCount: workspaces.filter((w) => w.workspaceState === 'FAILED' || w.workspaceState === 'ARCHIVED').length,
    duplicateRiskCount,
    runtimeMismatchCount: mismatchCount,
    lastQuery: query,
    lastState: state,
  };
}

export function resetWorkspaceHostingDiagnosticsForTests(): void {
  diagnostics = {
    workspaceHostingAuthorityActive: false,
    registeredWorkspaceCount: 0,
    activeSessionCount: 0,
    readyWorkspaceCount: 0,
    isolatedWorkspaceCount: 0,
    blockedWorkspaceCount: 0,
    duplicateRiskCount: 0,
    runtimeMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function workspaceHostingFoundationKey(): string {
  return 'workspace_hosting_foundation';
}
