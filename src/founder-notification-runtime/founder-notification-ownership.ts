/**
 * Founder Notification Runtime Foundation — ownership tracking.
 */

import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { NotificationOwnership } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function buildNotificationOwnership(input: {
  notificationId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  createdBy?: string;
}): NotificationOwnership {
  return {
    notificationId: input.notificationId,
    ownerModule: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'founder_notification_runtime_foundation',
    createdBy: input.createdBy ?? FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    notificationAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordNotificationOwnershipHistory(notificationId: string, summary: string): void {
  recordNotificationHistoryEntry({
    notificationId,
    category: 'OWNERSHIP',
    summary,
    scopeUsed: notificationId,
  });
}

export function registerNotificationOwnership(
  notificationId: string,
  ownership: NotificationOwnership,
): NotificationOwnership {
  recordNotificationOwnershipHistory(notificationId, `Ownership registered for ${ownership.ownerModule}`);
  return ownership;
}
