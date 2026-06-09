/**
 * Notification Delivery Foundation — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryCloudLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToCloud(
  deliveryId: string,
  runtimeId: string,
): DeliveryCloudLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  const runtime = getRuntime(runtimeId);
  if (!record || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== record.deliveryOwnership.projectId;
  const link: DeliveryCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeDeliveryRecord({
    ...record,
    deliveryCloudLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'CLOUD',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryCloudLink.runtimeId ?? null;
}

export function listDeliveriesByCloud(runtimeId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter((r) => r.deliveryCloudLink.runtimeId === runtimeId);
}

export function detectDeliveryCloudMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const runtime = getRuntime(record.deliveryCloudLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryCloudLink.mismatchDetected
  );
}
