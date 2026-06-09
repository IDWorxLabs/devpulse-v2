/**
 * Founder Inbox Foundation — filtering layer.
 */

import { listStoredInboxEntries } from './founder-inbox-store.js';
import type { FounderInboxEntry, InboxCategory, InboxPriority } from './founder-inbox-types.js';

export function filterByProject(projectId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxOwnership.projectId === projectId);
}

export function filterByRuntime(runtimeId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxOwnership.runtimeId === runtimeId);
}

export function filterByPriority(priority: InboxPriority): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxPriority.priority === priority);
}

export function filterByCategory(category: InboxCategory): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxCategory === category);
}

export function filterByDevice(deviceId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxOwnership.deviceId === deviceId);
}

export function filterByCrossDeviceSession(crossDeviceSessionId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter(
    (e) => e.inboxOwnership.crossDeviceSessionId === crossDeviceSessionId,
  );
}

export function filterUnread(): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) =>
    ['CREATED', 'UNREAD', 'VISIBLE'].includes(e.inboxState),
  );
}

export function filterAcknowledged(): FounderInboxEntry[] {
  return listStoredInboxEntries().filter(
    (e) => e.inboxState === 'ACKNOWLEDGED' || e.inboxAcknowledgement !== null,
  );
}

export function filterArchived(): FounderInboxEntry[] {
  return listStoredInboxEntries().filter(
    (e) => e.inboxState === 'ARCHIVED' || e.inboxArchive !== null,
  );
}
