/**
 * Founder Notification Runtime Foundation — channel metadata.
 */

import { getStoredNotification, storeNotification, listStoredNotifications } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { NotificationChannelMeta, NotificationChannel } from './founder-notification-types.js';

export function buildDefaultNotificationChannel(
  primaryChannel: NotificationChannel = 'IN_APP',
): NotificationChannelMeta {
  return {
    primaryChannel,
    fallbackChannels: primaryChannel === 'IN_APP' ? ['OPERATOR_FEED'] : ['IN_APP'],
    channelReason: `Default channel ${primaryChannel} — authority only, no real delivery`,
    deliveryBlocked: true,
  };
}

export function registerNotificationChannel(
  notificationId: string,
  channelMeta: NotificationChannelMeta,
): NotificationChannelMeta | null {
  const notification = getStoredNotification(notificationId);
  if (!notification) return null;

  storeNotification({
    ...notification,
    notificationChannel: channelMeta,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'CHANNEL',
    summary: `Channel set to ${channelMeta.primaryChannel} — delivery blocked (authority only)`,
    scopeUsed: notificationId,
  });

  return channelMeta;
}

export function getNotificationChannel(notificationId: string): NotificationChannelMeta | null {
  return getStoredNotification(notificationId)?.notificationChannel ?? null;
}

export function listNotificationsByChannel(channel: NotificationChannel): string[] {
  return listStoredNotifications()
    .filter((n) => n.notificationChannel.primaryChannel === channel)
    .map((n) => n.notificationId);
}
