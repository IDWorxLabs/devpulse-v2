/**
 * Founder Notification Runtime Foundation — notification manager.
 */

import {
  getStoredNotification,
  listStoredNotifications,
  storeNotification,
} from './founder-notification-store.js';
import { registerNotificationOwnership } from './founder-notification-ownership.js';
import type { FounderNotification, NotificationOwnership } from './founder-notification-types.js';

export function createNotification(notification: FounderNotification): FounderNotification {
  storeNotification(notification);
  registerNotificationOwnership(notification.notificationId, notification.notificationOwnership);
  return notification;
}

export function getNotification(notificationId: string): FounderNotification | null {
  return getStoredNotification(notificationId);
}

export function listNotifications(): FounderNotification[] {
  return listStoredNotifications();
}

export function trackNotificationMetadata(
  notificationId: string,
  metadata: Partial<FounderNotification['notificationMetadata']>,
): FounderNotification | null {
  const notification = getStoredNotification(notificationId);
  if (!notification) return null;

  const updated: FounderNotification = {
    ...notification,
    notificationMetadata: { ...notification.notificationMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeNotification(updated);
  return updated;
}

export function trackNotificationOwnership(
  notificationId: string,
  ownership: Partial<NotificationOwnership>,
): FounderNotification | null {
  const notification = getStoredNotification(notificationId);
  if (!notification) return null;

  const updatedOwnership = { ...notification.notificationOwnership, ...ownership };
  registerNotificationOwnership(notificationId, updatedOwnership);

  const updated: FounderNotification = {
    ...notification,
    notificationOwnership: updatedOwnership,
    updatedAt: Date.now(),
  };
  storeNotification(updated);
  return updated;
}
