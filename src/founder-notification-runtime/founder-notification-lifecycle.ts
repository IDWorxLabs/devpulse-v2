/**
 * Founder Notification Runtime Foundation — lifecycle tracking (no delivery).
 */

import {
  nextNotificationLifecycleEventId,
  storeNotificationLifecycleEvent,
  getStoredNotification,
  listStoredNotificationLifecycleEvents,
} from './founder-notification-store.js';
import { setNotificationState } from './founder-notification-state-manager.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import type {
  NotificationLifecycleEvent,
  NotificationLifecycleEventType,
  NotificationState,
} from './founder-notification-types.js';
import { FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE } from './founder-notification-types.js';

const EVENT_STATE_MAP: Record<NotificationLifecycleEventType, NotificationState> = {
  NOTIFICATION_CREATED: 'CREATED',
  NOTIFICATION_ROUTED: 'ROUTED',
  NOTIFICATION_VISIBLE: 'VISIBLE',
  NOTIFICATION_VIEWED: 'VIEWED',
  NOTIFICATION_ACKNOWLEDGED: 'ACKNOWLEDGED',
  NOTIFICATION_DISMISSED: 'DISMISSED',
  NOTIFICATION_ARCHIVED: 'ARCHIVED',
  NOTIFICATION_FAILED: 'FAILED',
};

export function recordNotificationLifecycleEvent(
  notificationId: string,
  eventType: NotificationLifecycleEventType,
  notes = '',
): NotificationLifecycleEvent | null {
  const notification = getStoredNotification(notificationId);
  if (!notification) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = notification.notificationState;

  const event: NotificationLifecycleEvent = {
    eventId: nextNotificationLifecycleEventId(),
    notificationId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeNotificationLifecycleEvent(event);

  if (previousState !== targetState) {
    setNotificationState(notificationId, targetState, eventType === 'NOTIFICATION_CREATED');
  }

  recordNotificationHistoryEntry({
    notificationId,
    category: 'LIFECYCLE',
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: notificationId,
  });

  return event;
}

export function initializeNotification(notificationId: string): NotificationLifecycleEvent | null {
  return recordNotificationLifecycleEvent(notificationId, 'NOTIFICATION_CREATED', 'Authority initialization');
}

export function routeNotification(notificationId: string): NotificationLifecycleEvent | null {
  return recordNotificationLifecycleEvent(notificationId, 'NOTIFICATION_ROUTED', 'Notification routed — metadata only');
}

export function makeNotificationVisible(notificationId: string): NotificationLifecycleEvent | null {
  return recordNotificationLifecycleEvent(notificationId, 'NOTIFICATION_VISIBLE', 'Notification visible in founder inbox');
}

export function markNotificationViewed(notificationId: string): NotificationLifecycleEvent | null {
  return recordNotificationLifecycleEvent(notificationId, 'NOTIFICATION_VIEWED', 'Notification viewed');
}

export function acknowledgeNotification(notificationId: string): NotificationLifecycleEvent | null {
  return recordNotificationLifecycleEvent(notificationId, 'NOTIFICATION_ACKNOWLEDGED', 'Notification acknowledged');
}

export function dismissNotification(notificationId: string): NotificationLifecycleEvent | null {
  return recordNotificationLifecycleEvent(notificationId, 'NOTIFICATION_DISMISSED', 'Notification dismissed');
}

export function archiveNotification(notificationId: string): NotificationLifecycleEvent | null {
  return recordNotificationLifecycleEvent(notificationId, 'NOTIFICATION_ARCHIVED', 'Notification archived');
}

export function failNotification(notificationId: string, reason = ''): NotificationLifecycleEvent | null {
  return recordNotificationLifecycleEvent(
    notificationId,
    'NOTIFICATION_FAILED',
    reason || 'Notification failed — inspect ownership and bridge links',
  );
}

export function listLifecycleEventsForNotification(notificationId: string): NotificationLifecycleEvent[] {
  return listStoredNotificationLifecycleEvents().filter((e) => e.notificationId === notificationId);
}

export function completeNotificationLifecycle(notificationId: string): void {
  routeNotification(notificationId);
  makeNotificationVisible(notificationId);
  markNotificationViewed(notificationId);
  acknowledgeNotification(notificationId);
}
