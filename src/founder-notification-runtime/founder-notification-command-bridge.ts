/**
 * Founder Notification Runtime Foundation — Mobile Command bridge.
 */

import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getStoredNotification, listStoredNotifications, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { FounderNotification, NotificationCommandLink } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function linkNotificationToCommand(
  notificationId: string,
  commandSessionId: string,
): NotificationCommandLink | null {
  const notification = getStoredNotification(notificationId);
  const command = getMobileCommandSession(commandSessionId);
  if (!notification || !command) return null;

  const mismatch = command.mobileCommandOwner.projectId !== notification.notificationOwnership.projectId;
  const link: NotificationCommandLink = {
    commandSessionId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeNotification({
    ...notification,
    notificationCommandLink: link,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'COMMAND',
    summary: `Linked to mobile command ${commandSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: commandSessionId,
  });

  return link;
}

export function getCommandForNotification(notificationId: string): string | null {
  return getStoredNotification(notificationId)?.notificationCommandLink.commandSessionId ?? null;
}

export function listNotificationsByCommand(commandSessionId: string): FounderNotification[] {
  return listStoredNotifications().filter(
    (n) =>
      n.notificationCommandLink.commandSessionId === commandSessionId ||
      n.notificationContext.commandSessionId === commandSessionId,
  );
}

export function detectNotificationCommandMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;
  const command = getMobileCommandSession(notification.notificationCommandLink.commandSessionId);
  if (!command) return true;
  return (
    command.mobileCommandOwner.projectId !== notification.notificationOwnership.projectId ||
    notification.notificationCommandLink.mismatchDetected
  );
}

export function resolveCommandForNotificationRegistration(
  commandSessionId: string,
): { exists: boolean; projectId: string | null } {
  const command = getMobileCommandSession(commandSessionId);
  if (!command) return { exists: false, projectId: null };
  return { exists: true, projectId: command.mobileCommandOwner.projectId };
}
