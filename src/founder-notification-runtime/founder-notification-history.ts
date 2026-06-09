/**
 * Founder Notification Runtime Foundation — history tracking.
 */

import {
  nextNotificationHistoryEntryId,
  storeNotificationHistoryEntry,
  listStoredNotificationHistoryEntries,
} from './founder-notification-store.js';
import type { NotificationHistoryEntry } from './founder-notification-types.js';

export function recordNotificationHistoryEntry(input: {
  notificationId: string;
  category: NotificationHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): NotificationHistoryEntry {
  const entry: NotificationHistoryEntry = {
    entryId: nextNotificationHistoryEntryId(),
    notificationId: input.notificationId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeNotificationHistoryEntry(entry);
  return entry;
}

export function getNotificationHistory(notificationId: string): NotificationHistoryEntry[] {
  return listStoredNotificationHistoryEntries().filter((e) => e.notificationId === notificationId);
}

export function listNotificationHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredNotificationHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
