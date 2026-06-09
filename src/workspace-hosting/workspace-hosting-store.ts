/**
 * Workspace Hosting Foundation — in-memory store.
 */

import type {
  HostedWorkspace,
  WorkspaceHistoryEntry,
  WorkspaceLifecycleEvent,
  WorkspaceSession,
  WorkspaceStateHistoryEntry,
} from './workspace-hosting-types.js';

const workspaces = new Map<string, HostedWorkspace>();
const sessions = new Map<string, WorkspaceSession>();
const lifecycleEvents = new Map<string, WorkspaceLifecycleEvent>();
const historyEntries = new Map<string, WorkspaceHistoryEntry>();
const stateHistory = new Map<string, WorkspaceStateHistoryEntry[]>();

let workspaceCounter = 0;
let sessionCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;

export function resetWorkspaceHostingStoreForTests(): void {
  workspaces.clear();
  sessions.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  workspaceCounter = 0;
  sessionCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
}

export function nextWorkspaceId(): string {
  workspaceCounter += 1;
  return `hws-${workspaceCounter.toString().padStart(4, '0')}`;
}

export function nextWorkspaceSessionId(): string {
  sessionCounter += 1;
  return `hwss-${sessionCounter.toString().padStart(4, '0')}`;
}

export function nextWorkspaceLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `hwlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextWorkspaceHistoryEntryId(): string {
  historyCounter += 1;
  return `hwhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function storeWorkspace(workspace: HostedWorkspace): void {
  workspaces.set(workspace.workspaceId, workspace);
}

export function getStoredWorkspace(workspaceId: string): HostedWorkspace | null {
  return workspaces.get(workspaceId) ?? null;
}

export function listStoredWorkspaces(): HostedWorkspace[] {
  return [...workspaces.values()];
}

export function storeWorkspaceSession(session: WorkspaceSession): void {
  sessions.set(session.sessionId, session);
}

export function getStoredWorkspaceSession(sessionId: string): WorkspaceSession | null {
  return sessions.get(sessionId) ?? null;
}

export function listStoredWorkspaceSessions(): WorkspaceSession[] {
  return [...sessions.values()];
}

export function storeWorkspaceLifecycleEvent(event: WorkspaceLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredWorkspaceLifecycleEvents(): WorkspaceLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeWorkspaceHistoryEntry(entry: WorkspaceHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredWorkspaceHistoryEntries(): WorkspaceHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendWorkspaceStateHistory(entry: WorkspaceStateHistoryEntry): void {
  const existing = stateHistory.get(entry.workspaceId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.workspaceId, existing);
}

export function getStoredWorkspaceStateHistory(workspaceId: string): WorkspaceStateHistoryEntry[] {
  return [...(stateHistory.get(workspaceId) ?? [])];
}
