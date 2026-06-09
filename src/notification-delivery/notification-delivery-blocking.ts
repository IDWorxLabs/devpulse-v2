/**
 * Notification Delivery Foundation — blocking metadata.
 */

import {
  nextDeliveryBlockId,
  getStoredDeliveryRecord,
  storeDeliveryRecord,
  storeDeliveryBlocking,
} from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import { setDeliveryState } from './notification-delivery-state-manager.js';
import type { DeliveryBlockingRecord } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function registerDeliveryBlocking(input: {
  deliveryId: string;
  blockReason: string;
  blockedBy?: string;
}): DeliveryBlockingRecord | null {
  const record = getStoredDeliveryRecord(input.deliveryId);
  if (!record) return null;

  const blocking: DeliveryBlockingRecord = {
    blockId: nextDeliveryBlockId(),
    deliveryId: input.deliveryId,
    blockedAt: Date.now(),
    blockReason: input.blockReason,
    blockedBy: input.blockedBy ?? NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    released: false,
    releasedAt: null,
  };

  storeDeliveryBlocking(blocking);
  storeDeliveryRecord({ ...record, deliveryBlocking: blocking, updatedAt: Date.now() });
  setDeliveryState(input.deliveryId, 'BLOCKED', true);

  recordDeliveryHistoryEntry({
    deliveryId: input.deliveryId,
    category: 'BLOCKING',
    summary: `Blocked: ${input.blockReason}`,
    scopeUsed: blocking.blockId,
  });

  return blocking;
}

export function blockDelivery(deliveryId: string, blockReason: string): DeliveryBlockingRecord | null {
  return registerDeliveryBlocking({ deliveryId, blockReason });
}

export function getDeliveryBlocking(deliveryId: string): DeliveryBlockingRecord | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryBlocking ?? null;
}
