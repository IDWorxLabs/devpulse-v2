/**
 * Build Strategy Engine — query layer.
 */

import { listStoredBuildStrategyRecords } from './build-strategy-store.js';
import type {
  BuildStrategySession,
  BuildStrategyCategory,
  BuildStrategyState,
  BuildMode,
  AutonomyLevel,
} from './build-strategy-types.js';

export interface BuildStrategyQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  deviceId?: string;
  crossDeviceSessionId?: string;
  autonomousBuildId?: string;
  pushId?: string;
  deliveryId?: string;
  notificationId?: string;
  inboxEntryId?: string;
  ownerModule?: string;
  strategyCategory?: BuildStrategyCategory;
  strategyState?: BuildStrategyState;
  buildMode?: BuildMode;
  autonomyLevel?: AutonomyLevel;
}

export function queryBuildStrategyRecords(query: BuildStrategyQuery = {}): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter((r) => matchesBuildStrategyQuery(r, query));
}

function matchesBuildStrategyQuery(record: BuildStrategySession, query: BuildStrategyQuery): boolean {
  const owner = record.strategyOwnership;
  if (query.projectId && owner.projectId !== query.projectId) return false;
  if (query.runtimeId && owner.runtimeId !== query.runtimeId) return false;
  if (query.workspaceId && owner.workspaceId !== query.workspaceId) return false;
  if (query.persistentBuildId && owner.persistentBuildId !== query.persistentBuildId) return false;
  if (query.deviceId && owner.deviceId !== query.deviceId) return false;
  if (query.crossDeviceSessionId && owner.crossDeviceSessionId !== query.crossDeviceSessionId) return false;
  if (query.autonomousBuildId && owner.autonomousBuildId !== query.autonomousBuildId) return false;
  if (query.pushId && owner.pushId !== query.pushId) return false;
  if (query.deliveryId && owner.deliveryId !== query.deliveryId) return false;
  if (query.notificationId && owner.notificationId !== query.notificationId) return false;
  if (query.inboxEntryId && owner.inboxEntryId !== query.inboxEntryId) return false;
  if (query.ownerModule && owner.ownerModule !== query.ownerModule) return false;
  if (query.strategyCategory && record.strategyCategory !== query.strategyCategory) return false;
  if (query.strategyState && record.strategyState !== query.strategyState) return false;
  if (query.buildMode && record.strategyMode?.buildMode !== query.buildMode) return false;
  if (query.autonomyLevel && record.strategyAutonomy?.autonomyLevel !== query.autonomyLevel) return false;
  return true;
}

export function listBuildStrategyRecordsAll(): BuildStrategySession[] {
  return listStoredBuildStrategyRecords();
}

export function listBuildStrategiesByAutonomousBuilder(autonomousBuildId: string): BuildStrategySession[] {
  return queryBuildStrategyRecords({ autonomousBuildId });
}

export function listBuildStrategiesByPush(pushId: string): BuildStrategySession[] {
  return queryBuildStrategyRecords({ pushId });
}

export function listBuildStrategiesByDelivery(deliveryId: string): BuildStrategySession[] {
  return queryBuildStrategyRecords({ deliveryId });
}

export function listBuildStrategiesByNotification(notificationId: string): BuildStrategySession[] {
  return queryBuildStrategyRecords({ notificationId });
}

export function listBuildStrategiesByInbox(inboxEntryId: string): BuildStrategySession[] {
  return queryBuildStrategyRecords({ inboxEntryId });
}

export function listBuildStrategiesByProject(projectId: string): BuildStrategySession[] {
  return queryBuildStrategyRecords({ projectId });
}

export function listBuildStrategiesByRuntime(runtimeId: string): BuildStrategySession[] {
  return queryBuildStrategyRecords({ runtimeId });
}

export function listBuildStrategiesByState(state: BuildStrategyState): BuildStrategySession[] {
  return queryBuildStrategyRecords({ strategyState: state });
}

export function countBuildStrategiesByState(state: BuildStrategyState): number {
  return listStoredBuildStrategyRecords().filter((r) => r.strategyState === state).length;
}
