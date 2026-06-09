/**
 * Notification Delivery Foundation — Founder Notification Runtime bridge.
 */

import { getNotification, listNotificationsAll } from '../founder-notification-runtime/index.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryNotificationLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToNotification(
  deliveryId: string,
  notificationId: string,
): DeliveryNotificationLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  const notification = getNotification(notificationId);
  if (!record || !notification) return null;

  const mismatch =
    notification.notificationOwnership.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryOwnership.notificationId !== notificationId;

  const link: DeliveryNotificationLink = {
    notificationId,
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeDeliveryRecord({
    ...record,
    notificationId,
    deliveryOwnership: { ...record.deliveryOwnership, notificationId },
    deliveryNotificationLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'NOTIFICATION',
    summary: `Linked to notification ${notificationId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: notificationId,
  });

  return link;
}

export function getNotificationForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryNotificationLink.notificationId ?? null;
}

export function listDeliveriesByNotificationBridge(notificationId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter((r) => r.deliveryNotificationLink.notificationId === notificationId);
}

export function detectDeliveryNotificationMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const notification = getNotification(record.deliveryNotificationLink.notificationId);
  if (!notification) return true;
  return (
    notification.notificationOwnership.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryNotificationLink.mismatchDetected
  );
}

export function resolveNotificationForDeliveryRegistration(
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
