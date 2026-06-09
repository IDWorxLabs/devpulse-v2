/**
 * Founder Notification Runtime Foundation — routing metadata.
 */

import {
  nextNotificationRoutingId,
  storeNotificationRouting,
  getStoredNotification,
  storeNotification,
  listStoredNotificationRoutings,
} from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { NotificationRouting, NotificationChannel } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function registerNotificationRouting(input: {
  notificationId: string;
  targetChannel: NotificationChannel;
  targetDevice: string;
  routingReason?: string;
  sourceRuntime?: string;
}): NotificationRouting | null {
  const notification = getStoredNotification(input.notificationId);
  if (!notification) return null;

  const routing: NotificationRouting = {
    routingId: nextNotificationRoutingId(),
    notificationId: input.notificationId,
    sourceRuntime: input.sourceRuntime ?? FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    targetChannel: input.targetChannel,
    targetDevice: input.targetDevice,
    routingReason: input.routingReason ?? `Route to ${input.targetChannel} — authority only, no real delivery`,
    routingTimestamp: Date.now(),
    routingStatus: 'ROUTED',
  };

  storeNotificationRouting(routing);
  storeNotification({
    ...notification,
    notificationRoutings: [...notification.notificationRoutings, routing],
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId: input.notificationId,
    category: 'ROUTING',
    summary: `Routed to ${input.targetChannel} via ${routing.routingId}`,
    scopeUsed: routing.routingId,
  });

  return routing;
}

export function getNotificationRouting(routingId: string): NotificationRouting | null {
  return listStoredNotificationRoutings().find((r) => r.routingId === routingId) ?? null;
}

export function listRoutingsForNotification(notificationId: string): NotificationRouting[] {
  return listStoredNotificationRoutings().filter((r) => r.notificationId === notificationId);
}

export function listNotificationsByRoutingChannel(channel: NotificationChannel): string[] {
  return listStoredNotificationRoutings()
    .filter((r) => r.targetChannel === channel)
    .map((r) => r.notificationId);
}
