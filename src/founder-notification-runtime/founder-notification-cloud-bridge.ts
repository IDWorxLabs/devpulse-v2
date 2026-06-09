/**
 * Founder Notification Runtime Foundation — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import { getStoredNotification, listStoredNotifications, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { FounderNotification, NotificationCloudLink } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function linkNotificationToCloud(
  notificationId: string,
  runtimeId: string,
): NotificationCloudLink | null {
  const notification = getStoredNotification(notificationId);
  const runtime = getRuntime(runtimeId);
  if (!notification || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== notification.notificationOwnership.projectId;
  const link: NotificationCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeNotification({
    ...notification,
    notificationCloudLink: link,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'CLOUD',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForNotification(notificationId: string): string | null {
  return getStoredNotification(notificationId)?.notificationCloudLink.runtimeId ?? null;
}

export function listNotificationsByCloud(runtimeId: string): FounderNotification[] {
  return listStoredNotifications().filter((n) => n.notificationCloudLink.runtimeId === runtimeId);
}

export function detectNotificationCloudMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;
  const runtime = getRuntime(notification.notificationCloudLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== notification.notificationOwnership.projectId ||
    notification.notificationCloudLink.mismatchDetected
  );
}

export function resolveRuntimeForNotificationRegistration(
  runtimeId: string,
): { exists: boolean; projectId: string | null } {
  const runtime = getRuntime(runtimeId);
  if (!runtime) return { exists: false, projectId: null };
  return { exists: true, projectId: runtime.runtimeOwner.projectId };
}
