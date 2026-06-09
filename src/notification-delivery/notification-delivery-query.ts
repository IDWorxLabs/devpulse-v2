/**
 * Notification Delivery Foundation — query layer.
 */

import { listStoredDeliveryRecords } from './notification-delivery-store.js';
import type {
  NotificationDeliveryRecord,
  DeliveryCategory,
  DeliveryPriority,
  DeliveryState,
  DeliveryChannel,
} from './notification-delivery-types.js';

export interface DeliveryQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  deviceId?: string;
  crossDeviceSessionId?: string;
  notificationId?: string;
  inboxEntryId?: string;
  ownerModule?: string;
  deliveryCategory?: DeliveryCategory;
  deliveryState?: DeliveryState;
  priority?: DeliveryPriority;
  channel?: DeliveryChannel;
}

export function queryDeliveryRecords(query: DeliveryQuery = {}): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords().filter((r) => matchesDeliveryQuery(r, query));
}

function matchesDeliveryQuery(record: NotificationDeliveryRecord, query: DeliveryQuery): boolean {
  const owner = record.deliveryOwnership;
  if (query.projectId && owner.projectId !== query.projectId) return false;
  if (query.runtimeId && owner.runtimeId !== query.runtimeId) return false;
  if (query.workspaceId && owner.workspaceId !== query.workspaceId) return false;
  if (query.persistentBuildId && owner.persistentBuildId !== query.persistentBuildId) return false;
  if (query.deviceId && owner.deviceId !== query.deviceId) return false;
  if (query.crossDeviceSessionId && owner.crossDeviceSessionId !== query.crossDeviceSessionId) return false;
  if (query.notificationId && owner.notificationId !== query.notificationId) return false;
  if (query.inboxEntryId && owner.inboxEntryId !== query.inboxEntryId) return false;
  if (query.ownerModule && owner.ownerModule !== query.ownerModule) return false;
  if (query.deliveryCategory && record.deliveryCategory !== query.deliveryCategory) return false;
  if (query.deliveryState && record.deliveryState !== query.deliveryState) return false;
  if (query.priority && record.deliveryPriority.priority !== query.priority) return false;
  if (query.channel) {
    const ch =
      record.deliveryRoute?.targetChannel ??
      record.deliveryIntent?.intentChannel ??
      record.deliveryEligibility?.channel;
    if (ch !== query.channel) return false;
  }
  return true;
}

export function listDeliveryRecordsAll(): NotificationDeliveryRecord[] {
  return listStoredDeliveryRecords();
}

export function listDeliveriesByNotification(notificationId: string): NotificationDeliveryRecord[] {
  return queryDeliveryRecords({ notificationId });
}

export function listDeliveriesByInboxEntry(inboxEntryId: string): NotificationDeliveryRecord[] {
  return queryDeliveryRecords({ inboxEntryId });
}

export function listDeliveriesByProject(projectId: string): NotificationDeliveryRecord[] {
  return queryDeliveryRecords({ projectId });
}

export function listDeliveriesByRuntime(runtimeId: string): NotificationDeliveryRecord[] {
  return queryDeliveryRecords({ runtimeId });
}

export function listDeliveriesByWorkspace(workspaceId: string): NotificationDeliveryRecord[] {
  return queryDeliveryRecords({ workspaceId });
}

export function listDeliveriesByPersistentBuild(persistentBuildId: string): NotificationDeliveryRecord[] {
  return queryDeliveryRecords({ persistentBuildId });
}

export function listDeliveriesByDevice(deviceId: string): NotificationDeliveryRecord[] {
  return queryDeliveryRecords({ deviceId });
}

export function listDeliveriesByCrossDeviceSession(crossDeviceSessionId: string): NotificationDeliveryRecord[] {
  return queryDeliveryRecords({ crossDeviceSessionId });
}

export function listDeliveriesByState(state: DeliveryState): NotificationDeliveryRecord[] {
  return queryDeliveryRecords({ deliveryState: state });
}

export function countDeliveriesByState(state: DeliveryState): number {
  return listStoredDeliveryRecords().filter((r) => r.deliveryState === state).length;
}
