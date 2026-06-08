/**
 * Workspace manager — in-memory multi-project workspace foundation.
 */

import { buildWorkspaceIdentity, identityKey, normalizeProjectId } from './workspace-identity.js';
import type { Workspace, WorkspaceCreateInput, WorkspaceNotification, WorkspaceState, SourceWorld } from './types.js';
import { MAX_WORKSPACES } from './types.js';

function cloneWorkspace(workspace: Workspace): Workspace {
  return {
    ...workspace,
    stateSequence: [...workspace.stateSequence],
  };
}

function appendState(workspace: Workspace, state: WorkspaceState): void {
  if (!workspace.stateSequence.includes(state)) {
    workspace.stateSequence.push(state);
  }
  workspace.workspaceState = state;
}

export class WorkspaceManager {
  private readonly workspaces = new Map<string, Workspace>();
  private readonly byProjectId = new Map<string, string>();
  private readonly notifications: WorkspaceNotification[] = [];

  createWorkspace(input: WorkspaceCreateInput): Workspace {
    if (this.workspaces.size >= MAX_WORKSPACES) {
      throw new Error(`Maximum workspace limit reached (${MAX_WORKSPACES})`);
    }

    const normalizedProjectId = normalizeProjectId(input.projectId);
    if (this.byProjectId.has(normalizedProjectId)) {
      throw new Error(`Project already has a workspace: ${normalizedProjectId}`);
    }

    const identity = buildWorkspaceIdentity(input);
    const workspace: Workspace = {
      ...identity,
      workspaceState: 'WORKSPACE_DEFINED',
      createdAt: Date.now(),
      stateSequence: ['WORKSPACE_DEFINED', 'WORKSPACE_CREATED'],
    };
    appendState(workspace, 'WORKSPACE_CREATED');

    this.workspaces.set(workspace.workspaceId, cloneWorkspace(workspace));
    this.byProjectId.set(normalizedProjectId, workspace.workspaceId);
    return cloneWorkspace(workspace);
  }

  getWorkspace(workspaceId: string): Workspace | null {
    const ws = this.workspaces.get(workspaceId);
    return ws ? cloneWorkspace(ws) : null;
  }

  lookupByProjectId(projectId: string): Workspace | null {
    const id = this.byProjectId.get(normalizeProjectId(projectId));
    return id ? this.getWorkspace(id) : null;
  }

  listWorkspaces(): Workspace[] {
    return [...this.workspaces.values()]
      .filter((w) => w.workspaceState !== 'WORKSPACE_DELETED')
      .map(cloneWorkspace);
  }

  getWorkspaceCount(): number {
    return this.listWorkspaces().length;
  }

  getActiveWorkspaceCount(): number {
    return this.listWorkspaces().filter((w) => w.workspaceState === 'WORKSPACE_ACTIVE').length;
  }

  activateWorkspace(workspaceId: string): Workspace | null {
    return this.transition(workspaceId, 'WORKSPACE_ACTIVE');
  }

  pauseWorkspace(workspaceId: string): Workspace | null {
    return this.transition(workspaceId, 'WORKSPACE_PAUSED');
  }

  archiveWorkspace(workspaceId: string): Workspace | null {
    return this.transition(workspaceId, 'WORKSPACE_ARCHIVED');
  }

  deleteWorkspace(workspaceId: string): Workspace | null {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return null;
    appendState(ws, 'WORKSPACE_DELETED');
    this.byProjectId.delete(ws.projectId);
    return cloneWorkspace(ws);
  }

  tagNotification(sourceWorld: SourceWorld, message: string, workspaceId: string | null = null): WorkspaceNotification {
    const notification: WorkspaceNotification = {
      notificationId: `world2-notify-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceWorld,
      workspaceId,
      message,
      createdAt: Date.now(),
    };
    this.notifications.push({ ...notification });
    return { ...notification };
  }

  getNotifications(): WorkspaceNotification[] {
    return this.notifications.map((n) => ({ ...n }));
  }

  getOwnershipKey(workspaceId: string): string | null {
    const ws = this.workspaces.get(workspaceId);
    return ws ? identityKey(ws) : null;
  }

  private transition(workspaceId: string, state: WorkspaceState): Workspace | null {
    const ws = this.workspaces.get(workspaceId);
    if (!ws || ws.workspaceState === 'WORKSPACE_DELETED') {
      return null;
    }
    appendState(ws, state);
    return cloneWorkspace(ws);
  }

  clear(): void {
    this.workspaces.clear();
    this.byProjectId.clear();
    this.notifications.length = 0;
  }
}

export function lookupOutputKey(manager: WorkspaceManager, projectId: string): string {
  const ws = manager.lookupByProjectId(projectId);
  return ws ? identityKey(ws) : 'NOT_FOUND';
}
