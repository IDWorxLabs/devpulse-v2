/**
 * Notification Delivery Foundation — Cross Device bridge.
 */

import { getCrossDeviceSession } from '../cross-device-runtime/index.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords, storeDeliveryRecord } from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { NotificationDeliveryRecord, DeliveryCrossDeviceLink } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function linkDeliveryToCrossDevice(
  deliveryId: string,
  crossDeviceSessionId: string,
): DeliveryCrossDeviceLink | null {
  const record = getStoredDeliveryRecord(deliveryId);
  const crossDevice = getCrossDeviceSession(crossDeviceSessionId);
  if (!record || !crossDevice) return null;

  const mismatch = crossDevice.crossDeviceOwner.projectId !== record.deliveryOwnership.projectId;
  const link: DeliveryCrossDeviceLink = {
    crossDeviceSessionId,
    linkedAt: Date.now(),
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeDeliveryRecord({
    ...record,
    deliveryCrossDeviceLink: link,
    updatedAt: Date.now(),
  });

  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'CROSS_DEVICE',
    summary: `Linked to cross device ${crossDeviceSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: crossDeviceSessionId,
  });

  return link;
}

export function getCrossDeviceForDelivery(deliveryId: string): string | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryCrossDeviceLink.crossDeviceSessionId ?? null;
}

export function listDeliveriesByCrossDevice(crossDeviceSessionId: string): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter(
    (r) => r.deliveryCrossDeviceLink.crossDeviceSessionId === crossDeviceSessionId,
  );
}

export function detectDeliveryCrossDeviceMismatch(deliveryId: string): boolean {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return true;
  const crossDevice = getCrossDeviceSession(record.deliveryCrossDeviceLink.crossDeviceSessionId);
  if (!crossDevice) return true;
  return (
    crossDevice.crossDeviceOwner.projectId !== record.deliveryOwnership.projectId ||
    record.deliveryCrossDeviceLink.mismatchDetected
  );
}
