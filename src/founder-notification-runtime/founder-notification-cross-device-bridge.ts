/**
 * Founder Notification Runtime Foundation — Cross Device bridge.
 */

import { getCrossDeviceSession } from '../cross-device-runtime/index.js';
import { getStoredNotification, listStoredNotifications, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { FounderNotification, NotificationCrossDeviceLink } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function linkNotificationToCrossDevice(
  notificationId: string,
  crossDeviceSessionId: string,
): NotificationCrossDeviceLink | null {
  const notification = getStoredNotification(notificationId);
  const crossDevice = getCrossDeviceSession(crossDeviceSessionId);
  if (!notification || !crossDevice) return null;

  const mismatch = crossDevice.crossDeviceOwner.projectId !== notification.notificationOwnership.projectId;
  const link: NotificationCrossDeviceLink = {
    crossDeviceSessionId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeNotification({
    ...notification,
    notificationCrossDeviceLink: link,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'CROSS_DEVICE',
    summary: `Linked to cross device ${crossDeviceSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: crossDeviceSessionId,
  });

  return link;
}

export function getCrossDeviceForNotification(notificationId: string): string | null {
  return getStoredNotification(notificationId)?.notificationCrossDeviceLink.crossDeviceSessionId ?? null;
}

export function listNotificationsByCrossDevice(crossDeviceSessionId: string): FounderNotification[] {
  return listStoredNotifications().filter(
    (n) => n.notificationCrossDeviceLink.crossDeviceSessionId === crossDeviceSessionId,
  );
}

export function detectNotificationCrossDeviceMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;
  const crossDevice = getCrossDeviceSession(notification.notificationCrossDeviceLink.crossDeviceSessionId);
  if (!crossDevice) return true;
  return (
    crossDevice.crossDeviceOwner.projectId !== notification.notificationOwnership.projectId ||
    notification.notificationCrossDeviceLink.mismatchDetected
  );
}

export function resolveCrossDeviceForNotificationRegistration(
  crossDeviceSessionId: string,
): { exists: boolean; projectId: string | null } {
  const crossDevice = getCrossDeviceSession(crossDeviceSessionId);
  if (!crossDevice) return { exists: false, projectId: null };
  return { exists: true, projectId: crossDevice.crossDeviceOwner.projectId };
}
