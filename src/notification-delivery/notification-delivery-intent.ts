/**
 * Notification Delivery Foundation — delivery intent metadata.
 */

import {
  nextDeliveryIntentId,
  getStoredDeliveryRecord,
  storeDeliveryRecord,
  storeDeliveryIntent,
} from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { DeliveryCategory, DeliveryChannel, DeliveryIntent } from './notification-delivery-types.js';

export function registerDeliveryIntent(input: {
  deliveryId: string;
  intentCategory: DeliveryCategory;
  intentChannel: DeliveryChannel;
  intentReason?: string;
}): DeliveryIntent | null {
  const record = getStoredDeliveryRecord(input.deliveryId);
  if (!record) return null;

  const intent: DeliveryIntent = {
    intentId: nextDeliveryIntentId(),
    deliveryId: input.deliveryId,
    intentCategory: input.intentCategory,
    intentChannel: input.intentChannel,
    intentReason: input.intentReason ?? `Plan delivery via ${input.intentChannel} — metadata only`,
    planningOnly: true,
    createdAt: Date.now(),
  };

  storeDeliveryIntent(intent);
  storeDeliveryRecord({ ...record, deliveryIntent: intent, updatedAt: Date.now() });

  recordDeliveryHistoryEntry({
    deliveryId: input.deliveryId,
    category: 'INTENT',
    summary: `Intent ${intent.intentId}: ${input.intentCategory} → ${input.intentChannel}`,
    scopeUsed: intent.intentId,
  });

  return intent;
}

export function getDeliveryIntent(deliveryId: string): DeliveryIntent | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryIntent ?? null;
}
