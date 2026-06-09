/**
 * Founder Notification Runtime Foundation — Operator Feed bridge.
 */

import { getStoredNotification, listStoredNotifications, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { FounderNotification, NotificationOperatorFeedLink } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function linkNotificationToOperatorFeed(notificationId: string): NotificationOperatorFeedLink | null {
  const notification = getStoredNotification(notificationId);
  if (!notification) return null;

  const link: NotificationOperatorFeedLink = {
    feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  storeNotification({
    ...notification,
    notificationOperatorFeedLink: link,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'OPERATOR_FEED',
    summary: `Linked to operator feed authority ${link.feedAuthorityId}`,
    scopeUsed: link.feedAuthorityId,
  });

  return link;
}

export function getOperatorFeedForNotification(notificationId: string): string | null {
  return getStoredNotification(notificationId)?.notificationOperatorFeedLink.feedAuthorityId ?? null;
}

export function listNotificationsByOperatorFeed(feedAuthorityId: string): FounderNotification[] {
  return listStoredNotifications().filter(
    (n) => n.notificationOperatorFeedLink.feedAuthorityId === feedAuthorityId,
  );
}

export function detectNotificationOperatorFeedMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;
  return notification.notificationOperatorFeedLink.mismatchDetected;
}
