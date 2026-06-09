/**
 * Founder Notification Runtime Foundation — Mobile Preview bridge.
 */

import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getStoredNotification, listStoredNotifications, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { FounderNotification, NotificationPreviewLink } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function linkNotificationToPreview(
  notificationId: string,
  previewId: string,
): NotificationPreviewLink | null {
  const notification = getStoredNotification(notificationId);
  const preview = getMobilePreviewSession(previewId);
  if (!notification || !preview) return null;

  const mismatch = preview.mobilePreviewOwner.projectId !== notification.notificationOwnership.projectId;
  const link: NotificationPreviewLink = {
    previewId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeNotification({
    ...notification,
    notificationPreviewLink: link,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'PREVIEW',
    summary: `Linked to mobile preview ${previewId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: previewId,
  });

  return link;
}

export function getPreviewForNotification(notificationId: string): string | null {
  return getStoredNotification(notificationId)?.notificationPreviewLink.previewId ?? null;
}

export function listNotificationsByPreview(previewId: string): FounderNotification[] {
  return listStoredNotifications().filter(
    (n) =>
      n.notificationPreviewLink.previewId === previewId ||
      n.notificationContext.previewId === previewId,
  );
}

export function detectNotificationPreviewMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;
  const preview = getMobilePreviewSession(notification.notificationPreviewLink.previewId);
  if (!preview) return true;
  return (
    preview.mobilePreviewOwner.projectId !== notification.notificationOwnership.projectId ||
    notification.notificationPreviewLink.mismatchDetected
  );
}

export function resolvePreviewForNotificationRegistration(
  previewId: string,
): { exists: boolean; projectId: string | null } {
  const preview = getMobilePreviewSession(previewId);
  if (!preview) return { exists: false, projectId: null };
  return { exists: true, projectId: preview.mobilePreviewOwner.projectId };
}
