/**
 * Mobile Push Foundation — ownership tracking (planning layer only).
 */

import { recordPushHistoryEntry } from './mobile-push-history.js';
import type { PushOwnership } from './mobile-push-types.js';
import { MOBILE_PUSH_FOUNDATION_OWNER_MODULE } from './mobile-push-types.js';

export function buildPushOwnership(input: {
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
}): PushOwnership {
  return {
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
    ownerModule: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'mobile_push_foundation',
    creationTimestamp: Date.now(),
  };
}

export function recordPushOwnershipHistory(pushId: string, summary: string): void {
  recordPushHistoryEntry({
    pushId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: pushId,
  });
}

export function registerPushOwnership(pushId: string, ownership: PushOwnership): PushOwnership {
  recordPushOwnershipHistory(pushId, `Push ownership registered for ${ownership.ownerModule}`);
  return ownership;
}
