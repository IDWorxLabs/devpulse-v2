/**
 * Mobile Push Foundation — Notification Delivery bridge (primary upstream).
 */

import { getDeliveryRecord, listDeliveryRecordsAll } from '../notification-delivery/index.js';
import { getStoredPushRecord, listStoredPushRecords, storePushRecord } from './mobile-push-store.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { MobilePushRecord, PushDeliveryLink } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function linkPushToDelivery(
  pushId: string,
  deliveryId: string,
): PushDeliveryLink | null {
  const record = getStoredPushRecord(pushId);
  const delivery = getDeliveryRecord(deliveryId);
  if (!record || !delivery) return null;

  const mismatch =
    delivery.deliveryOwnership.projectId !== record.pushOwnership.projectId ||
    record.pushOwnership.deliveryId !== deliveryId;

  const link: PushDeliveryLink = {
    deliveryId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storePushRecord({
    ...record,
    deliveryId,
    pushOwnership: { ...record.pushOwnership, deliveryId },
    pushDeliveryLink: link,
    updatedAt: Date.now(),
  });

  recordPushHistoryEntry({
    pushId,
    category: 'DELIVERY',
    summary: `Linked to delivery ${deliveryId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: deliveryId,
  });

  return link;
}

export function getDeliveryForPush(pushId: string): string | null {
  return getStoredPushRecord(pushId)?.pushDeliveryLink.deliveryId ?? null;
}

export function listPushRecordsByDelivery(deliveryId: string): MobilePushRecord[] {
  return listStoredPushRecords().filter((r) => r.pushDeliveryLink.deliveryId === deliveryId);
}

export function detectPushDeliveryMismatch(pushId: string): boolean {
  const record = getStoredPushRecord(pushId);
  if (!record) return true;
  const delivery = getDeliveryRecord(record.pushDeliveryLink.deliveryId);
  if (!delivery) return true;
  return (
    delivery.deliveryOwnership.projectId !== record.pushOwnership.projectId ||
    record.pushDeliveryLink.mismatchDetected
  );
}

export function resolveDeliveryForPushRegistration(
  deliveryId: string,
): { exists: boolean; projectId: string | null; notificationId: string | null; inboxEntryId: string | null } {
  const delivery = getDeliveryRecord(deliveryId);
  if (!delivery) return { exists: false, projectId: null, notificationId: null, inboxEntryId: null };
  return {
    exists: true,
    projectId: delivery.deliveryOwnership.projectId,
    notificationId: delivery.notificationId,
    inboxEntryId: delivery.inboxEntryId,
  };
}

export function findDeliveryByName(deliveryName: string): string | null {
  const match = listDeliveryRecordsAll().find((d) => d.deliveryMetadata.deliveryName === deliveryName);
  return match?.deliveryId ?? null;
}
