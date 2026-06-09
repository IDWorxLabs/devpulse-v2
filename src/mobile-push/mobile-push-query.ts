/**
 * Mobile Push Foundation — query layer.
 */

import { listStoredPushRecords } from './mobile-push-store.js';
import type {
  MobilePushRecord,
  PushCategory,
  PushState,
  PushPlatform,
} from './mobile-push-types.js';

export interface PushQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  deviceId?: string;
  crossDeviceSessionId?: string;
  deliveryId?: string;
  notificationId?: string;
  inboxEntryId?: string;
  ownerModule?: string;
  pushCategory?: PushCategory;
  pushState?: PushState;
  platform?: PushPlatform;
}

export function queryPushRecords(query: PushQuery = {}): MobilePushRecord[] {
  return listStoredPushRecords().filter((r) => matchesPushQuery(r, query));
}

function matchesPushQuery(record: MobilePushRecord, query: PushQuery): boolean {
  const owner = record.pushOwnership;
  if (query.projectId && owner.projectId !== query.projectId) return false;
  if (query.runtimeId && owner.runtimeId !== query.runtimeId) return false;
  if (query.workspaceId && owner.workspaceId !== query.workspaceId) return false;
  if (query.persistentBuildId && owner.persistentBuildId !== query.persistentBuildId) return false;
  if (query.deviceId && owner.deviceId !== query.deviceId) return false;
  if (query.crossDeviceSessionId && owner.crossDeviceSessionId !== query.crossDeviceSessionId) return false;
  if (query.deliveryId && owner.deliveryId !== query.deliveryId) return false;
  if (query.notificationId && owner.notificationId !== query.notificationId) return false;
  if (query.inboxEntryId && owner.inboxEntryId !== query.inboxEntryId) return false;
  if (query.ownerModule && owner.ownerModule !== query.ownerModule) return false;
  if (query.pushCategory && record.pushCategory !== query.pushCategory) return false;
  if (query.pushState && record.pushState !== query.pushState) return false;
  if (query.platform) {
    const plat =
      record.pushRoute?.targetPlatform ??
      record.pushPlatform?.platform ??
      record.pushEligibility?.platform;
    if (plat !== query.platform) return false;
  }
  return true;
}

export function listPushRecordsAll(): MobilePushRecord[] {
  return listStoredPushRecords();
}

export function listPushesByDelivery(deliveryId: string): MobilePushRecord[] {
  return queryPushRecords({ deliveryId });
}

export function listPushesByNotification(notificationId: string): MobilePushRecord[] {
  return queryPushRecords({ notificationId });
}

export function listPushesByInboxEntry(inboxEntryId: string): MobilePushRecord[] {
  return queryPushRecords({ inboxEntryId });
}

export function listPushesByProject(projectId: string): MobilePushRecord[] {
  return queryPushRecords({ projectId });
}

export function listPushesByRuntime(runtimeId: string): MobilePushRecord[] {
  return queryPushRecords({ runtimeId });
}

export function listPushesByWorkspace(workspaceId: string): MobilePushRecord[] {
  return queryPushRecords({ workspaceId });
}

export function listPushesByPersistentBuild(persistentBuildId: string): MobilePushRecord[] {
  return queryPushRecords({ persistentBuildId });
}

export function listPushesByDevice(deviceId: string): MobilePushRecord[] {
  return queryPushRecords({ deviceId });
}

export function listPushesByCrossDeviceSession(crossDeviceSessionId: string): MobilePushRecord[] {
  return queryPushRecords({ crossDeviceSessionId });
}

export function listPushesByState(state: PushState): MobilePushRecord[] {
  return queryPushRecords({ pushState: state });
}

export function countPushesByState(state: PushState): number {
  return listStoredPushRecords().filter((r) => r.pushState === state).length;
}

export function listPushesByPlatformQuery(platform: PushPlatform): MobilePushRecord[] {
  return queryPushRecords({ platform });
}
