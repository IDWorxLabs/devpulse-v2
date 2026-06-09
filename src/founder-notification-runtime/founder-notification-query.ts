/**
 * Founder Notification Runtime Foundation — query layer.
 */

import { listStoredNotifications } from './founder-notification-store.js';
import type {
  FounderNotification,
  NotificationCategory,
  NotificationPriority,
  NotificationChannel,
  NotificationState,
} from './founder-notification-types.js';

export interface NotificationQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  deviceId?: string;
  crossDeviceSessionId?: string;
  ownerModule?: string;
  notificationCategory?: NotificationCategory;
  notificationState?: NotificationState;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
}

export function queryNotifications(query: NotificationQuery = {}): FounderNotification[] {
  return listStoredNotifications().filter((n) => matchesNotificationQuery(n, query));
}

function matchesNotificationQuery(notification: FounderNotification, query: NotificationQuery): boolean {
  const owner = notification.notificationOwnership;
  if (query.projectId && owner.projectId !== query.projectId) return false;
  if (query.runtimeId && owner.runtimeId !== query.runtimeId) return false;
  if (query.workspaceId && owner.workspaceId !== query.workspaceId) return false;
  if (query.persistentBuildId && owner.persistentBuildId !== query.persistentBuildId) return false;
  if (query.deviceId && owner.deviceId !== query.deviceId) return false;
  if (query.crossDeviceSessionId && owner.crossDeviceSessionId !== query.crossDeviceSessionId) return false;
  if (query.ownerModule && owner.ownerModule !== query.ownerModule) return false;
  if (query.notificationCategory && notification.notificationCategory !== query.notificationCategory) return false;
  if (query.notificationState && notification.notificationState !== query.notificationState) return false;
  if (query.priority && notification.notificationPriority.priority !== query.priority) return false;
  if (query.channel && notification.notificationChannel.primaryChannel !== query.channel) return false;
  return true;
}

export function listNotificationsAll(): FounderNotification[] {
  return listStoredNotifications();
}

export function listNotificationsByProject(projectId: string): FounderNotification[] {
  return queryNotifications({ projectId });
}

export function listNotificationsByRuntime(runtimeId: string): FounderNotification[] {
  return queryNotifications({ runtimeId });
}

export function listNotificationsByWorkspace(workspaceId: string): FounderNotification[] {
  return queryNotifications({ workspaceId });
}

export function listNotificationsByPersistentBuild(persistentBuildId: string): FounderNotification[] {
  return queryNotifications({ persistentBuildId });
}

export function listNotificationsByDevice(deviceId: string): FounderNotification[] {
  return queryNotifications({ deviceId });
}

export function listNotificationsByCrossDeviceSession(crossDeviceSessionId: string): FounderNotification[] {
  return queryNotifications({ crossDeviceSessionId });
}

export function listNotificationsByCategory(category: NotificationCategory): FounderNotification[] {
  return queryNotifications({ notificationCategory: category });
}

export function countNotificationsByState(state: NotificationState): number {
  return listStoredNotifications().filter((n) => n.notificationState === state).length;
}
