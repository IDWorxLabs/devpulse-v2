/**
 * Build Strategy Engine — ownership tracking (strategy/planning layer only).
 */

import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategyOwnership } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function buildBuildStrategyOwnership(input: {
  buildStrategyId: string;
  autonomousBuildId: string;
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
}): BuildStrategyOwnership {
  return {
    buildStrategyId: input.buildStrategyId,
    autonomousBuildId: input.autonomousBuildId,
    pushId: input.pushId,
    deliveryId: input.deliveryId,
    notificationId: input.notificationId,
    inboxEntryId: input.inboxEntryId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    ownerModule: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    ownerDomain: 'build_strategy_engine',
    creationTimestamp: Date.now(),
  };
}

export function recordBuildStrategyOwnershipHistory(buildStrategyId: string, summary: string): void {
  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: buildStrategyId,
  });
}

export function registerBuildStrategyOwnership(
  buildStrategyId: string,
  ownership: BuildStrategyOwnership,
): BuildStrategyOwnership {
  recordBuildStrategyOwnershipHistory(buildStrategyId, `Strategy ownership registered for ${ownership.ownerModule}`);
  return ownership;
}
