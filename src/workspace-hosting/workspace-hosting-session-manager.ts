/**
 * Workspace Hosting Foundation — session manager (authority only).
 */

import {
  nextWorkspaceSessionId,
  storeWorkspaceSession,
  getStoredWorkspaceSession,
  listStoredWorkspaceSessions,
  getStoredWorkspace,
  storeWorkspace,
} from './workspace-hosting-store.js';
import { updateWorkspaceSessionOwnership } from './workspace-hosting-ownership.js';
import { recordWorkspaceHistoryEntry } from './workspace-hosting-history.js';
import type { WorkspaceSession, WorkspaceVisibility } from './workspace-hosting-types.js';
import { WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE } from './workspace-hosting-types.js';

export function createWorkspaceSession(input: {
  workspaceId: string;
  projectId: string;
  runtimeId: string;
  sessionOwner?: string;
  sessionMetadata?: Record<string, string>;
  visibility?: WorkspaceVisibility;
}): WorkspaceSession | null {
  const workspace = getStoredWorkspace(input.workspaceId);
  if (!workspace) return null;

  const now = Date.now();
  const session: WorkspaceSession = {
    sessionId: nextWorkspaceSessionId(),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    sessionOwner: input.sessionOwner ?? WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
    sessionState: workspace.workspaceState,
    sessionMetadata: input.sessionMetadata ?? { authority: 'workspace_hosting_foundation' },
    sessionVisibility: input.visibility ?? workspace.workspaceVisibility,
    createdAt: now,
    updatedAt: now,
  };
  storeWorkspaceSession(session);

  storeWorkspace({
    ...workspace,
    workspaceOwner: updateWorkspaceSessionOwnership(workspace.workspaceOwner, session.sessionId),
    updatedAt: now,
  });

  recordWorkspaceHistoryEntry({
    workspaceId: input.workspaceId,
    category: 'SESSION',
    summary: `Session ${session.sessionId} created for workspace ${input.workspaceId}`,
    consumer: input.sessionOwner ?? null,
    scopeUsed: input.runtimeId,
  });

  return session;
}

export function getWorkspaceSession(sessionId: string): WorkspaceSession | null {
  return getStoredWorkspaceSession(sessionId);
}

export function listWorkspaceSessions(workspaceId?: string): WorkspaceSession[] {
  const all = listStoredWorkspaceSessions();
  if (!workspaceId) return all;
  return all.filter((s) => s.workspaceId === workspaceId);
}

export function trackSessionOwnership(sessionId: string, owner: string): WorkspaceSession | null {
  const session = getStoredWorkspaceSession(sessionId);
  if (!session) return null;
  const updated = { ...session, sessionOwner: owner, updatedAt: Date.now() };
  storeWorkspaceSession(updated);
  recordWorkspaceHistoryEntry({
    workspaceId: session.workspaceId,
    category: 'SESSION',
    summary: `Session ${sessionId} ownership tracked: ${owner}`,
    consumer: owner,
    scopeUsed: 'SESSION_OWNERSHIP',
  });
  return updated;
}

export function trackSessionMetadata(
  sessionId: string,
  metadata: Record<string, string>,
): WorkspaceSession | null {
  const session = getStoredWorkspaceSession(sessionId);
  if (!session) return null;
  const updated = {
    ...session,
    sessionMetadata: { ...session.sessionMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeWorkspaceSession(updated);
  return updated;
}

export function resetWorkspaceHostingSessionManagerForTests(): void {
  /* cleared via store reset */
}
