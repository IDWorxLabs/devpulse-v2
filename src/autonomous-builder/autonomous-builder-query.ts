/**
 * Autonomous Builder Foundation — query layer.
 */

import { listStoredAutonomousBuildRecords } from './autonomous-builder-store.js';
import type {
  AutonomousBuildSession,
  AutonomousBuildCategory,
  AutonomousBuildState,
} from './autonomous-builder-types.js';

export interface AutonomousBuildQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  deviceId?: string;
  crossDeviceSessionId?: string;
  pushId?: string;
  deliveryId?: string;
  notificationId?: string;
  inboxEntryId?: string;
  ownerModule?: string;
  buildCategory?: AutonomousBuildCategory;
  buildState?: AutonomousBuildState;
}

export function queryAutonomousBuildRecords(query: AutonomousBuildQuery = {}): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter((r) => matchesAutonomousBuildQuery(r, query));
}

function matchesAutonomousBuildQuery(record: AutonomousBuildSession, query: AutonomousBuildQuery): boolean {
  const owner = record.buildOwnership;
  if (query.projectId && owner.projectId !== query.projectId) return false;
  if (query.runtimeId && owner.runtimeId !== query.runtimeId) return false;
  if (query.workspaceId && owner.workspaceId !== query.workspaceId) return false;
  if (query.persistentBuildId && owner.persistentBuildId !== query.persistentBuildId) return false;
  if (query.deviceId && owner.deviceId !== query.deviceId) return false;
  if (query.crossDeviceSessionId && owner.crossDeviceSessionId !== query.crossDeviceSessionId) return false;
  if (query.pushId && owner.pushId !== query.pushId) return false;
  if (query.deliveryId && owner.deliveryId !== query.deliveryId) return false;
  if (query.notificationId && owner.notificationId !== query.notificationId) return false;
  if (query.inboxEntryId && owner.inboxEntryId !== query.inboxEntryId) return false;
  if (query.ownerModule && owner.ownerModule !== query.ownerModule) return false;
  if (query.buildCategory && record.buildCategory !== query.buildCategory) return false;
  if (query.buildState && record.buildState !== query.buildState) return false;
  return true;
}

export function listAutonomousBuildRecordsAll(): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords();
}

export function listAutonomousBuildsByPush(pushId: string): AutonomousBuildSession[] {
  return queryAutonomousBuildRecords({ pushId });
}

export function listAutonomousBuildsByDelivery(deliveryId: string): AutonomousBuildSession[] {
  return queryAutonomousBuildRecords({ deliveryId });
}

export function listAutonomousBuildsByNotification(notificationId: string): AutonomousBuildSession[] {
  return queryAutonomousBuildRecords({ notificationId });
}

export function listAutonomousBuildsByInbox(inboxEntryId: string): AutonomousBuildSession[] {
  return queryAutonomousBuildRecords({ inboxEntryId });
}

export function listAutonomousBuildsByProject(projectId: string): AutonomousBuildSession[] {
  return queryAutonomousBuildRecords({ projectId });
}

export function listAutonomousBuildsByRuntime(runtimeId: string): AutonomousBuildSession[] {
  return queryAutonomousBuildRecords({ runtimeId });
}

export function listAutonomousBuildsByState(state: AutonomousBuildState): AutonomousBuildSession[] {
  return queryAutonomousBuildRecords({ buildState: state });
}

export function countAutonomousBuildsByState(state: AutonomousBuildState): number {
  return listStoredAutonomousBuildRecords().filter((r) => r.buildState === state).length;
}
