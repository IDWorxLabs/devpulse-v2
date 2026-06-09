/**
 * Notification Delivery Foundation — deferral metadata.
 */

import {
  nextDeliveryDeferId,
  getStoredDeliveryRecord,
  storeDeliveryRecord,
  storeDeliveryDeferral,
} from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import { setDeliveryState } from './notification-delivery-state-manager.js';
import type { DeliveryDeferralRecord } from './notification-delivery-types.js';

export function registerDeliveryDeferral(input: {
  deliveryId: string;
  deferReason: string;
  deferredUntil?: number | null;
}): DeliveryDeferralRecord | null {
  const record = getStoredDeliveryRecord(input.deliveryId);
  if (!record) return null;

  const deferral: DeliveryDeferralRecord = {
    deferralId: nextDeliveryDeferId(),
    deliveryId: input.deliveryId,
    deferredAt: Date.now(),
    deferReason: input.deferReason,
    deferredUntil: input.deferredUntil ?? null,
    resumed: false,
    resumedAt: null,
  };

  storeDeliveryDeferral(deferral);
  storeDeliveryRecord({ ...record, deliveryDeferral: deferral, updatedAt: Date.now() });
  setDeliveryState(input.deliveryId, 'DEFERRED', true);

  recordDeliveryHistoryEntry({
    deliveryId: input.deliveryId,
    category: 'DEFERRAL',
    summary: `Deferred: ${input.deferReason}`,
    scopeUsed: deferral.deferralId,
  });

  return deferral;
}

export function deferDelivery(
  deliveryId: string,
  deferReason: string,
  deferredUntil?: number | null,
): DeliveryDeferralRecord | null {
  return registerDeliveryDeferral({ deliveryId, deferReason, deferredUntil });
}

export function getDeliveryDeferral(deliveryId: string): DeliveryDeferralRecord | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryDeferral ?? null;
}
