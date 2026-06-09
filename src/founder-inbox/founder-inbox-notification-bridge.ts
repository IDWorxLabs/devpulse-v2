/**
 * Founder Inbox Foundation — Founder Notification Runtime bridge (PRIMARY).
 * References notification authority — does NOT create notification ownership.
 */

import { getNotification, listNotificationsAll } from '../founder-notification-runtime/index.js';
import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxNotificationLink } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function linkInboxToNotification(
  inboxEntryId: string,
  notificationId: string,
): InboxNotificationLink | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  const notification = getNotification(notificationId);
  if (!entry || !notification) return null;

  const mismatch =
    notification.notificationOwnership.projectId !== entry.inboxOwnership.projectId ||
    entry.inboxOwnership.notificationId !== notificationId;

  const link: InboxNotificationLink = {
    notificationId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeInboxEntry({
    ...entry,
    notificationId,
    inboxOwnership: { ...entry.inboxOwnership, notificationId },
    inboxNotificationLink: link,
    updatedAt: Date.now(),
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'NOTIFICATION',
    summary: `Linked to notification ${notificationId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: notificationId,
  });

  return link;
}

export function getNotificationForInbox(inboxEntryId: string): string | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxNotificationLink.notificationId ?? null;
}

export function listInboxEntriesByNotification(notificationId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxNotificationLink.notificationId === notificationId);
}

export function detectInboxNotificationMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  const notification = getNotification(entry.inboxNotificationLink.notificationId);
  if (!notification) return true;
  return (
    notification.notificationOwnership.projectId !== entry.inboxOwnership.projectId ||
    entry.inboxNotificationLink.mismatchDetected
  );
}

export function resolveNotificationForInboxRegistration(
  notificationId: string,
): { exists: boolean; projectId: string | null } {
  const notification = getNotification(notificationId);
  if (!notification) return { exists: false, projectId: null };
  return { exists: true, projectId: notification.notificationOwnership.projectId };
}

export function findNotificationByName(notificationName: string): string | null {
  const match = listNotificationsAll().find(
    (n) => n.notificationMetadata.notificationName === notificationName,
  );
  return match?.notificationId ?? null;
}
