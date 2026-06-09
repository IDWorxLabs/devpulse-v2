/**
 * Mobile Push Foundation — Founder Notification Runtime bridge.
 */

import { getNotification, listNotificationsAll } from '../founder-notification-runtime/index.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushNotificationLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToNotification(
  pushId: string,
  notificationId: string,
): PushNotificationLink | null {
  const record = getStoredPushRecord(pushId);
  const notification = getNotification(notificationId);
  if (!record || !notification) return null;

  const mismatch =
    notification.notificationOwnership.projectId !== record.pushOwnership.projectId ||
    record.pushOwnership.notificationId !== notificationId;

  const link: PushNotificationLink = {
    notificationId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    notificationId,
    pushOwnership: { ...record.pushOwnership, notificationId },
    pushNotificationLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'NOTIFICATION',
    summary: `Linked to notification ${notificationId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: notificationId,
  });

  return link;
}

export function getNotificationForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushNotificationLink.notificationId ?? null;
}

export function listPushRecordsByNotification(notificationId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter((r) => r.pushNotificationLink.notificationId === notificationId);
}

export function detectPushNotificationMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const notification = getNotification(record.pushNotificationLink.notificationId);
  if (!notification) return true;
  return (
    notification.notificationOwnership.projectId !== record.pushOwnership.projectId ||
    record.pushNotificationLink.mismatchDetected
  );
}

export function resolveNotificationForPushRegistration(
  notificationId: string,
): { exists: boolean; projectId: string | null } {
  const notification = getNotification(notificationId);
  if (!notification) return { exists: false, projectId: null };
  return { exists: true, projectId: notification.notificationOwnership.projectId };
}

export function findNotificationByName(notificationName: string): string | null {
  const match = listNotificationsAll().find((n) => n.notificationMetadata.notificationName === notificationName);
  return match?.notificationId ?? null;
}
