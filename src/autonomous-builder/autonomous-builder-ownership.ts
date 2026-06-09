/**
 * Autonomous Builder Foundation — ownership tracking (planning layer only).
 */

import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildOwnership } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

export function buildAutonomousBuildOwnership(input: {
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
}): AutonomousBuildOwnership {
  return {
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
    ownerModule: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'autonomous_builder_foundation',
    creationTimestamp: Date.now(),
  };
}

export function recordAutonomousBuildOwnershipHistory(autonomousBuildId: string, summary: string): void {
  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: autonomousBuildId,
  });
}

export function registerAutonomousBuildOwnership(
  autonomousBuildId: string,
  ownership: AutonomousBuildOwnership,
): AutonomousBuildOwnership {
  recordAutonomousBuildOwnershipHistory(autonomousBuildId, `Build ownership registered for ${ownership.ownerModule}`);
  return ownership;
}
