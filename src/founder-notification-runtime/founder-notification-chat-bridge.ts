/**
 * Founder Notification Runtime Foundation — Mobile Chat bridge.
 */

import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getStoredNotification, listStoredNotifications, storeNotification } from './founder-notification-store.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type { FounderNotification, NotificationChatLink } from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

export function linkNotificationToChat(
  notificationId: string,
  chatSessionId: string,
): NotificationChatLink | null {
  const notification = getStoredNotification(notificationId);
  const chat = getMobileChatSession(chatSessionId);
  if (!notification || !chat) return null;

  const mismatch = chat.mobileChatOwner.projectId !== notification.notificationOwnership.projectId;
  const link: NotificationChatLink = {
    chatSessionId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeNotification({
    ...notification,
    notificationChatLink: link,
    updatedAt: Date.now(),
  });

  recordNotificationHistoryEntry({
    notificationId,
    category: 'CHAT',
    summary: `Linked to mobile chat ${chatSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: chatSessionId,
  });

  return link;
}

export function getChatForNotification(notificationId: string): string | null {
  return getStoredNotification(notificationId)?.notificationChatLink.chatSessionId ?? null;
}

export function listNotificationsByChat(chatSessionId: string): FounderNotification[] {
  return listStoredNotifications().filter(
    (n) =>
      n.notificationChatLink.chatSessionId === chatSessionId ||
      n.notificationContext.chatSessionId === chatSessionId,
  );
}

export function detectNotificationChatMismatch(notificationId: string): boolean {
  const notification = getStoredNotification(notificationId);
  if (!notification) return true;
  const chat = getMobileChatSession(notification.notificationChatLink.chatSessionId);
  if (!chat) return true;
  return (
    chat.mobileChatOwner.projectId !== notification.notificationOwnership.projectId ||
    notification.notificationChatLink.mismatchDetected
  );
}

export function resolveChatForNotificationRegistration(
  chatSessionId: string,
): { exists: boolean; projectId: string | null } {
  const chat = getMobileChatSession(chatSessionId);
  if (!chat) return { exists: false, projectId: null };
  return { exists: true, projectId: chat.mobileChatOwner.projectId };
}
