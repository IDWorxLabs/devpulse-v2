/**
 * Notification Delivery Foundation — ownership tracking (planning layer only).
 */

import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import type { DeliveryOwnership } from './notification-delivery-types.js';
import { NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE } from './notification-delivery-types.js';

export function buildDeliveryOwnership(input: {
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
}): DeliveryOwnership {
  return {
    deliveryId: input.deliveryId,
    notificationId: input.notificationId,
    inboxEntryId: input.inboxEntryId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    ownerModule: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'notification_delivery_foundation',
    creationTimestamp: Date.now(),
  };
}

export function recordDeliveryOwnershipHistory(deliveryId: string, summary: string): void {
  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: deliveryId,
  });
}

export function registerDeliveryOwnership(deliveryId: string, ownership: DeliveryOwnership): DeliveryOwnership {
  recordDeliveryOwnershipHistory(deliveryId, `Delivery ownership registered for ${ownership.ownerModule}`);
  return ownership;
}
