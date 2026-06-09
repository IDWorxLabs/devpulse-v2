/**
 * Notification Delivery Foundation — targeting metadata.
 */

import {
  nextDeliveryTargetId,
  getStoredDeliveryRecord,
  storeDeliveryRecord,
  storeDeliveryTarget,
} from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { DeliveryChannel, DeliveryTarget } from './notification-delivery-types.js';

export function registerDeliveryTarget(input: {
  deliveryId: string;
  targetChannel: DeliveryChannel;
  targetDevice: string;
  targetReason?: string;
}): DeliveryTarget | null {
  const record = getStoredDeliveryRecord(input.deliveryId);
  if (!record) return null;

  const target: DeliveryTarget = {
    targetId: nextDeliveryTargetId(),
    deliveryId: input.deliveryId,
    targetChannel: input.targetChannel,
    targetDevice: input.targetDevice,
    targetReason: input.targetReason ?? `Target ${input.targetDevice} on ${input.targetChannel}`,
    selectedAt: Date.now(),
  };

  storeDeliveryTarget(target);
  storeDeliveryRecord({ ...record, deliveryTarget: target, updatedAt: Date.now() });

  recordDeliveryHistoryEntry({
    deliveryId: input.deliveryId,
    category: 'TARGETING',
    summary: `Target selected: ${target.targetId} → ${input.targetChannel}/${input.targetDevice}`,
    scopeUsed: target.targetId,
  });

  return target;
}

export function getDeliveryTarget(deliveryId: string): DeliveryTarget | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryTarget ?? null;
}

export function selectDeliveryTarget(
  deliveryId: string,
  targetChannel: DeliveryChannel,
  targetDevice: string,
): DeliveryTarget | null {
  return registerDeliveryTarget({ deliveryId, targetChannel, targetDevice });
}
