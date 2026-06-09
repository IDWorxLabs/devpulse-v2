/**
 * Workspace Hosting Foundation — lifecycle tracking (no execution).
 */

import {
  nextWorkspaceLifecycleEventId,
  storeWorkspaceLifecycleEvent,
  getStoredWorkspace,
  storeWorkspace,
  listStoredWorkspaceLifecycleEvents,
} from './workspace-hosting-store.js';
import { setWorkspaceState } from './workspace-hosting-state-manager.js';
import { recordWorkspaceHistoryEntry } from './workspace-hosting-history.js';
import { applyWorkspaceIsolation } from './workspace-hosting-isolation.js';
import type { WorkspaceLifecycleEvent, WorkspaceLifecycleEventType, WorkspaceState } from './workspace-hosting-types.js';
import { WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE } from './workspace-hosting-types.js';

const EVENT_STATE_MAP: Record<WorkspaceLifecycleEventType, WorkspaceState> = {
  WORKSPACE_CREATED: 'CREATED',
  WORKSPACE_INITIALIZED: 'INITIALIZING',
  WORKSPACE_ACTIVATED: 'ACTIVE',
  WORKSPACE_ISOLATED: 'ISOLATED',
  WORKSPACE_PAUSED: 'PAUSED',
  WORKSPACE_RESUMED: 'RESUMABLE',
  WORKSPACE_COMPLETED: 'COMPLETED',
  WORKSPACE_ARCHIVED: 'ARCHIVED',
  WORKSPACE_FAILED: 'FAILED',
  WORKSPACE_LINKED_TO_RUNTIME: 'READY',
};

export function recordWorkspaceLifecycleEvent(
  workspaceId: string,
  eventType: WorkspaceLifecycleEventType,
  notes = '',
): WorkspaceLifecycleEvent | null {
  const workspace = getStoredWorkspace(workspaceId);
  if (!workspace) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = workspace.workspaceState;

  const event: WorkspaceLifecycleEvent = {
    eventId: nextWorkspaceLifecycleEventId(),
    workspaceId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeWorkspaceLifecycleEvent(event);

  if (eventType === 'WORKSPACE_ISOLATED') {
    applyWorkspaceIsolation(workspaceId, 'STRICT');
  } else if (previousState !== targetState) {
    setWorkspaceState(workspaceId, targetState, eventType === 'WORKSPACE_INITIALIZED');
  }

  recordWorkspaceHistoryEntry({
    workspaceId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: 'LIFECYCLE',
  });

  return event;
}

export function activateWorkspace(workspaceId: string): WorkspaceLifecycleEvent | null {
  const workspace = getStoredWorkspace(workspaceId);
  if (!workspace) return null;

  if (workspace.workspaceState === 'CREATED') {
    recordWorkspaceLifecycleEvent(workspaceId, 'WORKSPACE_INITIALIZED', 'Authority initialization');
    setWorkspaceState(workspaceId, 'READY', true);
  }

  return recordWorkspaceLifecycleEvent(workspaceId, 'WORKSPACE_ACTIVATED', 'Authority activation — no cloud workers');
}

export function isolateWorkspace(workspaceId: string): WorkspaceLifecycleEvent | null {
  return recordWorkspaceLifecycleEvent(workspaceId, 'WORKSPACE_ISOLATED', 'Isolation metadata applied — no containers');
}

export function pauseWorkspace(workspaceId: string): WorkspaceLifecycleEvent | null {
  return recordWorkspaceLifecycleEvent(workspaceId, 'WORKSPACE_PAUSED', 'Authority pause — no execution');
}

export function resumeWorkspace(workspaceId: string): WorkspaceLifecycleEvent | null {
  const event = recordWorkspaceLifecycleEvent(workspaceId, 'WORKSPACE_RESUMED', 'Authority resume marker');
  if (event) setWorkspaceState(workspaceId, 'ACTIVE', true);
  return event;
}

export function completeWorkspace(workspaceId: string): WorkspaceLifecycleEvent | null {
  return recordWorkspaceLifecycleEvent(workspaceId, 'WORKSPACE_COMPLETED', 'Authority completion — no build executed');
}

export function archiveWorkspace(workspaceId: string): WorkspaceLifecycleEvent | null {
  return recordWorkspaceLifecycleEvent(workspaceId, 'WORKSPACE_ARCHIVED', 'Authority archival');
}

export function failWorkspace(workspaceId: string, reason: string): WorkspaceLifecycleEvent | null {
  const workspace = getStoredWorkspace(workspaceId);
  if (workspace) {
    storeWorkspace({
      ...workspace,
      workspaceState: 'FAILED',
      workspaceStatus: 'BLOCKED',
      updatedAt: Date.now(),
    });
  }
  return recordWorkspaceLifecycleEvent(workspaceId, 'WORKSPACE_FAILED', reason);
}

export function listLifecycleEventsForWorkspace(workspaceId: string): WorkspaceLifecycleEvent[] {
  return listStoredWorkspaceLifecycleEvents().filter((e) => e.workspaceId === workspaceId);
}
