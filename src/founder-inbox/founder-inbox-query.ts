/**
 * Founder Inbox Foundation — query layer.
 */

import { listStoredInboxEntries } from './founder-inbox-store.js';
import type { FounderInboxEntry, InboxCategory, InboxPriority, InboxState } from './founder-inbox-types.js';

export interface InboxQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  deviceId?: string;
  crossDeviceSessionId?: string;
  notificationId?: string;
  ownerModule?: string;
  inboxCategory?: InboxCategory;
  inboxState?: InboxState;
  priority?: InboxPriority;
}

export function queryInboxEntries(query: InboxQuery = {}): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => matchesInboxQuery(e, query));
}

function matchesInboxQuery(entry: FounderInboxEntry, query: InboxQuery): boolean {
  const owner = entry.inboxOwnership;
  if (query.projectId && owner.projectId !== query.projectId) return false;
  if (query.runtimeId && owner.runtimeId !== query.runtimeId) return false;
  if (query.workspaceId && owner.workspaceId !== query.workspaceId) return false;
  if (query.persistentBuildId && owner.persistentBuildId !== query.persistentBuildId) return false;
  if (query.deviceId && owner.deviceId !== query.deviceId) return false;
  if (query.crossDeviceSessionId && owner.crossDeviceSessionId !== query.crossDeviceSessionId) return false;
  if (query.notificationId && owner.notificationId !== query.notificationId) return false;
  if (query.ownerModule && owner.ownerModule !== query.ownerModule) return false;
  if (query.inboxCategory && entry.inboxCategory !== query.inboxCategory) return false;
  if (query.inboxState && entry.inboxState !== query.inboxState) return false;
  if (query.priority && entry.inboxPriority.priority !== query.priority) return false;
  return true;
}

export function listInboxEntriesAll(): FounderInboxEntry[] {
  return listStoredInboxEntries();
}

export function listInboxEntriesByProject(projectId: string): FounderInboxEntry[] {
  return queryInboxEntries({ projectId });
}

export function listInboxEntriesByRuntime(runtimeId: string): FounderInboxEntry[] {
  return queryInboxEntries({ runtimeId });
}

export function listInboxEntriesByWorkspace(workspaceId: string): FounderInboxEntry[] {
  return queryInboxEntries({ workspaceId });
}

export function listInboxEntriesByPersistentBuild(persistentBuildId: string): FounderInboxEntry[] {
  return queryInboxEntries({ persistentBuildId });
}

export function listInboxEntriesByDevice(deviceId: string): FounderInboxEntry[] {
  return queryInboxEntries({ deviceId });
}

export function listInboxEntriesByCrossDeviceSession(crossDeviceSessionId: string): FounderInboxEntry[] {
  return queryInboxEntries({ crossDeviceSessionId });
}

export function listInboxEntriesByCategory(category: InboxCategory): FounderInboxEntry[] {
  return queryInboxEntries({ inboxCategory: category });
}

export function countInboxEntriesByState(state: InboxState): number {
  return listStoredInboxEntries().filter((e) => e.inboxState === state).length;
}
