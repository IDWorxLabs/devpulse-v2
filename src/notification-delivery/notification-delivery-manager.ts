/**
 * Notification Delivery Foundation — delivery record manager (planning only).
 */

import {
  getStoredDeliveryRecord,
  listStoredDeliveryRecords,
  storeDeliveryRecord,
} from './notification-delivery-store.js';
import { registerDeliveryOwnership } from './notification-delivery-ownership.js';
import { registerDeliveryIntent } from './notification-delivery-intent.js';
import { registerDeliveryRoute } from './notification-delivery-routing.js';
import { registerDeliveryTarget } from './notification-delivery-targeting.js';
import { checkChannelEligibility } from './notification-delivery-channel-eligibility.js';
import { registerDeliveryPolicy } from './notification-delivery-policy.js';
import { blockDelivery } from './notification-delivery-blocking.js';
import { deferDelivery } from './notification-delivery-deferral.js';
import { setDeliveryState } from './notification-delivery-state-manager.js';
import { recordDeliveryLifecycleEvent } from './notification-delivery-lifecycle.js';
import type {
  DeliveryChannel,
  NotificationDeliveryRecord,
  DeliveryOwnership,
} from './notification-delivery-types.js';
import { resolveDefaultChannelForCategory } from './notification-delivery-types.js';

export function createDeliveryRecord(record: NotificationDeliveryRecord): NotificationDeliveryRecord {
  storeDeliveryRecord(record);
  registerDeliveryOwnership(record.deliveryId, record.deliveryOwnership);
  recordDeliveryLifecycleEvent(record.deliveryId, 'DELIVERY_CREATED', `Created ${record.deliveryMetadata.deliveryName}`);
  return record;
}

export function getDeliveryRecord(deliveryId: string): NotificationDeliveryRecord | null {
  return getStoredDeliveryRecord(deliveryId);
}

export function listDeliveryRecords(): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords();
}

export function planDelivery(
  deliveryId: string,
  channel?: DeliveryChannel,
): NotificationDeliveryRecord | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;

  const intentChannel = channel ?? resolveDefaultChannelForCategory(record.deliveryCategory);
  registerDeliveryIntent({
    deliveryId,
    intentCategory: record.deliveryCategory,
    intentChannel,
  });
  registerDeliveryPolicy({ deliveryId });
  recordDeliveryLifecycleEvent(deliveryId, 'DELIVERY_PLANNED', `Planned via ${intentChannel}`);
  return getStoredDeliveryRecord(deliveryId);
}

export function routeDelivery(
  deliveryId: string,
  targetChannel?: DeliveryChannel,
  targetDevice?: string,
): NotificationDeliveryRecord | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;

  const channel = targetChannel ?? record.deliveryIntent?.intentChannel ?? resolveDefaultChannelForCategory(record.deliveryCategory);
  const device = targetDevice ?? record.deliveryOwnership.deviceId;

  checkChannelEligibility(deliveryId, channel);
  recordDeliveryLifecycleEvent(deliveryId, 'DELIVERY_ELIGIBILITY_CHECKED');
  registerDeliveryRoute({ deliveryId, targetChannel: channel, targetDevice: device });
  recordDeliveryLifecycleEvent(deliveryId, 'DELIVERY_ROUTED');
  return getStoredDeliveryRecord(deliveryId);
}

export function selectDeliveryTarget(
  deliveryId: string,
  targetChannel?: DeliveryChannel,
  targetDevice?: string,
): NotificationDeliveryRecord | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;

  const channel = targetChannel ?? record.deliveryRoute?.targetChannel ?? 'IN_APP';
  const device = targetDevice ?? record.deliveryOwnership.deviceId;
  registerDeliveryTarget({ deliveryId, targetChannel: channel, targetDevice: device });
  recordDeliveryLifecycleEvent(deliveryId, 'DELIVERY_TARGET_SELECTED');
  return getStoredDeliveryRecord(deliveryId);
}

export function markDeliveryReady(deliveryId: string): NotificationDeliveryRecord | null {
  recordDeliveryLifecycleEvent(deliveryId, 'DELIVERY_READY', 'Planning complete — metadata only');
  return getStoredDeliveryRecord(deliveryId);
}

export function markDeliveryCompleted(deliveryId: string): NotificationDeliveryRecord | null {
  recordDeliveryLifecycleEvent(deliveryId, 'DELIVERY_COMPLETED', 'Planning marked complete — no real delivery');
  return getStoredDeliveryRecord(deliveryId);
}

export function markDeliveryFailed(deliveryId: string, reason = 'Planning failed'): NotificationDeliveryRecord | null {
  recordDeliveryLifecycleEvent(deliveryId, 'DELIVERY_FAILED', reason);
  return getStoredDeliveryRecord(deliveryId);
}

export function archiveDelivery(deliveryId: string): NotificationDeliveryRecord | null {
  recordDeliveryLifecycleEvent(deliveryId, 'DELIVERY_ARCHIVED');
  return getStoredDeliveryRecord(deliveryId);
}

export { blockDelivery, deferDelivery, checkChannelEligibility };

export function trackDeliveryMetadata(
  deliveryId: string,
  metadata: Partial<NotificationDeliveryRecord['deliveryMetadata']>,
): NotificationDeliveryRecord | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;

  const updated: NotificationDeliveryRecord = {
    ...record,
    deliveryMetadata: { ...record.deliveryMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeDeliveryRecord(updated);
  return updated;
}

export function trackDeliveryOwnership(
  deliveryId: string,
  ownership: Partial<DeliveryOwnership>,
): NotificationDeliveryRecord | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;

  const updatedOwnership = { ...record.deliveryOwnership, ...ownership };
  registerDeliveryOwnership(deliveryId, updatedOwnership);

  const updated: NotificationDeliveryRecord = {
    ...record,
    deliveryOwnership: updatedOwnership,
    updatedAt: Date.now(),
  };
  storeDeliveryRecord(updated);
  return updated;
}

export function runDeliveryPlanningPipeline(deliveryId: string): NotificationDeliveryRecord | null {
  planDelivery(deliveryId);
  routeDelivery(deliveryId);
  selectDeliveryTarget(deliveryId);
  markDeliveryReady(deliveryId);
  markDeliveryCompleted(deliveryId);
  return getStoredDeliveryRecord(deliveryId);
}
