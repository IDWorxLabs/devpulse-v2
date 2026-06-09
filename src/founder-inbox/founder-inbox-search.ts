/**
 * Founder Inbox Foundation — search layer.
 */

import { listStoredInboxEntries } from './founder-inbox-store.js';
import { getNotification, listNotificationsAll } from '../founder-notification-runtime/index.js';
import type { FounderInboxEntry } from './founder-inbox-types.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';

export function searchInbox(query: string): FounderInboxEntry[] {
  const lower = query.toLowerCase().trim();
  const results = listStoredInboxEntries().filter(
    (e) =>
      e.inboxMetadata.inboxEntryName.toLowerCase().includes(lower) ||
      e.inboxMetadata.inboxEntryDescription.toLowerCase().includes(lower) ||
      e.inboxMetadata.tags.some((t) => t.toLowerCase().includes(lower)) ||
      e.inboxEntryId.toLowerCase().includes(lower),
  );
  if (results.length > 0) {
    recordInboxHistoryEntry({
      inboxEntryId: results[0]!.inboxEntryId,
      category: 'SEARCH',
      summary: `searchInbox("${query}") → ${results.length} results`,
      scopeUsed: query,
    });
  }
  return results;
}

export function searchNotifications(query: string): FounderInboxEntry[] {
  const lower = query.toLowerCase().trim();
  return listStoredInboxEntries().filter((e) => {
    const notification = getNotification(e.notificationId);
    if (!notification) return e.notificationId.toLowerCase().includes(lower);
    return (
      notification.notificationMetadata.notificationName.toLowerCase().includes(lower) ||
      notification.notificationId.toLowerCase().includes(lower)
    );
  });
}

export function searchProjects(query: string): FounderInboxEntry[] {
  const lower = query.toLowerCase().trim();
  return listStoredInboxEntries().filter((e) => e.inboxOwnership.projectId.toLowerCase().includes(lower));
}

export function searchRuntimeReferences(query: string): FounderInboxEntry[] {
  const lower = query.toLowerCase().trim();
  const notificationIds = new Set(
    listNotificationsAll()
      .filter(
        (n) =>
          n.notificationOwnership.runtimeId.toLowerCase().includes(lower) ||
          n.notificationMetadata.notificationName.toLowerCase().includes(lower),
      )
      .map((n) => n.notificationId),
  );
  return listStoredInboxEntries().filter(
    (e) =>
      e.inboxOwnership.runtimeId.toLowerCase().includes(lower) || notificationIds.has(e.notificationId),
  );
}
