/**
 * Notification Delivery Foundation — channel eligibility metadata.
 */

import {
  nextDeliveryEligibilityId,
  getStoredDeliveryRecord,
  storeDeliveryRecord,
  storeDeliveryEligibility,
} from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { DeliveryChannel, DeliveryChannelEligibility } from './notification-delivery-types.js';
import { FORBIDDEN_DELIVERY_DUPLICATES } from './notification-delivery-types.js';

const REAL_DELIVERY_CHANNELS: DeliveryChannel[] = ['EMAIL', 'SMS', 'PUSH'];

export function registerDeliveryEligibility(input: {
  deliveryId: string;
  channel: DeliveryChannel;
  eligible?: boolean;
  eligibilityReason?: string;
}): DeliveryChannelEligibility | null {
  const record = getStoredDeliveryRecord(input.deliveryId);
  if (!record) return null;

  const isRealDeliveryChannel = REAL_DELIVERY_CHANNELS.includes(input.channel);
  const eligible =
    input.eligible ??
    (!isRealDeliveryChannel && input.channel !== 'UNKNOWN_CHANNEL');

  const eligibility: DeliveryChannelEligibility = {
    eligibilityId: nextDeliveryEligibilityId(),
    deliveryId: input.deliveryId,
    channel: input.channel,
    eligible,
    eligibilityReason:
      input.eligibilityReason ??
      (isRealDeliveryChannel
        ? `Channel ${input.channel} blocked — planning only, no real ${input.channel.toLowerCase()} delivery`
        : `Channel ${input.channel} eligible for planning metadata`),
    checkedAt: Date.now(),
  };

  storeDeliveryEligibility(eligibility);
  storeDeliveryRecord({ ...record, deliveryEligibility: eligibility, updatedAt: Date.now() });

  recordDeliveryHistoryEntry({
    deliveryId: input.deliveryId,
    category: 'ELIGIBILITY',
    summary: `Eligibility ${eligibility.eligibilityId}: ${input.channel}=${eligible}`,
    scopeUsed: eligibility.eligibilityId,
  });

  return eligibility;
}

export function checkChannelEligibility(
  deliveryId: string,
  channel: DeliveryChannel,
): DeliveryChannelEligibility | null {
  const forbidden = FORBIDDEN_DELIVERY_DUPLICATES.some((d) =>
    channel.toLowerCase().includes(d.replace(/_/g, '').slice(0, 4)),
  );
  return registerDeliveryEligibility({
    deliveryId,
    channel,
    eligible: !REAL_DELIVERY_CHANNELS.includes(channel) && !forbidden && channel !== 'UNKNOWN_CHANNEL',
  });
}

export function getDeliveryEligibility(deliveryId: string): DeliveryChannelEligibility | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryEligibility ?? null;
}
