/**
 * Founder Notification Runtime Foundation — priority metadata.
 */

import {
  getStoredNotification,
  storeNotification,
  listStoredNotifications,
} from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { NotificationPriorityMeta, NotificationPriority, NotificationCategory } from './founder-notification-types.js';

export function buildDefaultNotificationPriority(
  category: NotificationCategory = 'GENERAL_NOTIFICATION',
  priority: NotificationPriority = 'NORMAL',
): NotificationPriorityMeta {
  const escalated =
    category === 'FOUNDER_ALERT' ||
    priority === 'CRITICAL' ||
    priority === 'HIGH';
  return {
    priority,
    priorityReason: `Default priority for ${category} — metadata only`,
    escalated,
    escalationReason: escalated ? `Escalated due to ${category} / ${priority}` : null,
  };
}

export function registerNotificationPriority(
  notificationId: string,
  priorityMeta: NotificationPriorityMeta,
): NotificationPriorityMeta | null {
  const notification = getStoredNotification(notificationId);
  if (!notification) return null;

  storeNotification({
    ...notification,
    notificationPriority: priorityMeta,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'PRIORITY',
    summary: `Priority set to ${priorityMeta.priority}${priorityMeta.escalated ? ' (escalated)' : ''}`,
    scopeUsed: notificationId,
  });

  return priorityMeta;
}

export function getNotificationPriority(notificationId: string): NotificationPriorityMeta | null {
  return getStoredNotification(notificationId)?.notificationPriority ?? null;
}

export function listNotificationsByPriority(priority: NotificationPriority): string[] {
  return listStoredNotifications()
    .filter((n) => n.notificationPriority.priority === priority)
    .map((n) => n.notificationId);
}
