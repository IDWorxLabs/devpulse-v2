/**
 * Founder Notification Runtime Foundation — state manager.
 */

import {
  getStoredNotification,
  appendNotificationStateHistory,
  storeNotification,
  getStoredNotificationStateHistory,
} from './founder-notification-store.js';
import type { NotificationState, NotificationStateHistoryEntry } from './founder-notification-types.js';
import { isValidNotificationStateTransition } from './founder-notification-types.js';

export function setNotificationState(
  notificationId: string,
  newState: NotificationState,
  force = false,
): { ok: boolean; previousState: NotificationState | null; error?: string } {
  const notification = getStoredNotification(notificationId);
  if (!notification) {
    return { ok: false, previousState: null, error: `Notification not found: ${notificationId}` };
  }

  const previousState = notification.notificationState;
  if (!force && !isValidNotificationStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeNotification({
    ...notification,
    notificationState: newState,
    notificationStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendNotificationStateHistory({
    notificationId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getNotificationState(notificationId: string): NotificationState | null {
  return getStoredNotification(notificationId)?.notificationState ?? null;
}

export function trackNotificationStateHistory(notificationId: string): NotificationStateHistoryEntry[] {
  return getStoredNotificationStateHistory(notificationId);
}

function resolveStatusForState(state: NotificationState): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'ACKNOWLEDGED' || state === 'VIEWED' || state === 'VISIBLE') return 'HEALTHY';
  if (state === 'FAILED') return 'BLOCKED';
  if (state === 'ROUTED' || state === 'CREATED') return 'WAITING';
  if (state === 'DISMISSED' || state === 'ARCHIVED') return 'DEGRADED';
  return 'UNKNOWN';
}
