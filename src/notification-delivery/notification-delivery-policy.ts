/**
 * Notification Delivery Foundation — delivery policy metadata.
 */

import {
  nextDeliveryPolicyId,
  getStoredDeliveryRecord,
  storeDeliveryRecord,
  storeDeliveryPolicy,
} from './notification-delivery-store.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { DeliveryChannel, DeliveryPolicy } from './notification-delivery-types.js';
import { TRACKED_DELIVERY_CHANNELS } from './notification-delivery-types.js';

export function registerDeliveryPolicy(input: {
  deliveryId: string;
  policyName?: string;
  allowedChannels?: DeliveryChannel[];
  blockedChannels?: DeliveryChannel[];
  policyReason?: string;
}): DeliveryPolicy | null {
  const record = getStoredDeliveryRecord(input.deliveryId);
  if (!record) return null;

  const blockedChannels: DeliveryChannel[] = input.blockedChannels ?? ['EMAIL', 'SMS', 'PUSH'];
  const allowedChannels: DeliveryChannel[] =
    input.allowedChannels ??
    TRACKED_DELIVERY_CHANNELS.filter((c) => !blockedChannels.includes(c));

  const policy: DeliveryPolicy = {
    policyId: nextDeliveryPolicyId(),
    deliveryId: input.deliveryId,
    policyName: input.policyName ?? 'Default Planning Policy',
    allowedChannels,
    blockedChannels,
    policyReason: input.policyReason ?? 'Planning-only policy — no real email, SMS, or push delivery',
    appliedAt: Date.now(),
  };

  storeDeliveryPolicy(policy);
  storeDeliveryRecord({ ...record, deliveryPolicy: policy, updatedAt: Date.now() });

  recordDeliveryHistoryEntry({
    deliveryId: input.deliveryId,
    category: 'POLICY',
    summary: `Policy ${policy.policyId}: allowed=${allowedChannels.join(',')}`,
    scopeUsed: policy.policyId,
  });

  return policy;
}

export function getDeliveryPolicy(deliveryId: string): DeliveryPolicy | null {
  return getStoredDeliveryRecord(deliveryId)?.deliveryPolicy ?? null;
}
