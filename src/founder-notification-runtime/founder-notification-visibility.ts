/**
 * Founder Notification Runtime Foundation — visibility metadata.
 */

import { getStoredNotification, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { NotificationVisibility, NotificationCategory } from './founder-notification-types.js';

export function buildDefaultNotificationVisibility(
  category: NotificationCategory = 'GENERAL_NOTIFICATION',
): NotificationVisibility {
  const founderInbox =
    category === 'FOUNDER_ALERT' ||
    category === 'GENERAL_NOTIFICATION' ||
    category === 'APPROVAL_NOTIFICATION';
  const mobileVisible =
    category === 'MOBILE_NOTIFICATION' ||
    category === 'FOUNDER_ALERT' ||
    category === 'GENERAL_NOTIFICATION';
  return {
    visibleInFounderInbox: founderInbox,
    visibleInOperatorFeed: true,
    visibleInProjectVault: category !== 'SYSTEM_NOTIFICATION',
    visibleOnMobile: mobileVisible,
    visibleOnDesktop: true,
    visibleOnCloud: category === 'CLOUD_NOTIFICATION' || category === 'GENERAL_NOTIFICATION',
    visibilityReason: `Default visibility for ${category} — authority metadata only, no real delivery`,
  };
}

export function registerNotificationVisibility(
  notificationId: string,
  visibility: NotificationVisibility,
): NotificationVisibility | null {
  const issues = validateNotificationVisibility(visibility);
  if (issues.length > 0) return null;

  const notification = getStoredNotification(notificationId);
  if (!notification) return null;

  storeNotification({
    ...notification,
    notificationVisibility: visibility,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'VISIBILITY',
    summary: `Visibility updated — inbox=${visibility.visibleInFounderInbox} mobile=${visibility.visibleOnMobile}`,
    scopeUsed: notificationId,
  });

  return visibility;
}

export function getNotificationVisibility(notificationId: string): NotificationVisibility | null {
  return getStoredNotification(notificationId)?.notificationVisibility ?? null;
}

export function validateNotificationVisibility(visibility: NotificationVisibility): string[] {
  const issues: string[] = [];
  if (!visibility.visibilityReason?.trim()) issues.push('Missing visibility reason');
  return issues;
}
