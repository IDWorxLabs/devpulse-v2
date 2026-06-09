/**
 * Founder Notification Runtime Foundation — Mobile bridge (cross-device mobile visibility authority).
 */

import { getCrossDeviceSession, listCrossDeviceSessionsAll } from '../cross-device-runtime/index.js';
import { getStoredNotification, listStoredNotifications, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { FounderNotification, NotificationMobileLink } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function linkNotificationToMobile(
  notificationId: string,
  crossDeviceSessionId: string,
): NotificationMobileLink | null {
  const notification = getStoredNotification(notificationId);
  const crossDevice = getCrossDeviceSession(crossDeviceSessionId);
  if (!notification || !crossDevice) return null;

  const mismatch = crossDevice.crossDeviceOwner.projectId !== notification.notificationOwnership.projectId;
  const link: NotificationMobileLink = {
    crossDeviceSessionId,
    deviceId: crossDevice.crossDeviceOwner.deviceId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeNotification({
    ...notification,
    notificationMobileLink: link,
    notificationOwnership: {
      ...notification.notificationOwnership,
      deviceId: crossDevice.crossDeviceOwner.deviceId,
      crossDeviceSessionId,
    },
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'MOBILE',
    summary: `Linked to cross-device mobile ${crossDeviceSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: crossDeviceSessionId,
  });

  return link;
}

export function getMobileForNotification(notificationId: string): NotificationMobileLink | null {
  return getStoredNotification(notificationId)?.notificationMobileLink ?? null;
}

export function listNotificationsByMobile(crossDeviceSessionId: string): FounderNotification[] {
  return listStoredNotifications().filter(
    (n) =>
      n.notificationMobileLink.crossDeviceSessionId === crossDeviceSessionId ||
      n.notificationOwnership.crossDeviceSessionId === crossDeviceSessionId,
  );
}

export function detectNotificationMobileMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;
  const crossDevice = getCrossDeviceSession(notification.notificationMobileLink.crossDeviceSessionId);
  if (!crossDevice) return true;
  return (
    crossDevice.crossDeviceOwner.projectId !== notification.notificationOwnership.projectId ||
    notification.notificationMobileLink.mismatchDetected
  );
}

export function resolveMobileForNotificationRegistration(
  crossDeviceSessionId: string,
): { exists: boolean; projectId: string | null; deviceId: string | null } {
  const crossDevice = getCrossDeviceSession(crossDeviceSessionId);
  if (!crossDevice) return { exists: false, projectId: null, deviceId: null };
  return {
    exists: true,
    projectId: crossDevice.crossDeviceOwner.projectId,
    deviceId: crossDevice.crossDeviceOwner.deviceId,
  };
}

export function listCrossDeviceSessionsForMobile(): ReturnType<typeof listCrossDeviceSessionsAll> {
  return listCrossDeviceSessionsAll();
}
