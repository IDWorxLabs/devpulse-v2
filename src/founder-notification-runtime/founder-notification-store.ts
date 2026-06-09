/**
 * Founder Notification Runtime Foundation — in-memory store.
 */

import type {
  FounderNotification,
  NotificationHistoryEntry,
  NotificationLifecycleEvent,
  NotificationRouting,
  NotificationStateHistoryEntry,
} from './founder-notification-types.js';

const notifications = new Map<string, FounderNotification>();
const routings = new Map<string, NotificationRouting>();
const lifecycleEvents = new Map<string, NotificationLifecycleEvent>();
const historyEntries = new Map<string, NotificationHistoryEntry>();
const stateHistory = new Map<string, NotificationStateHistoryEntry[]>();

let notificationCounter = 0;
let routingCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let reportCounter = 0;

export function resetFounderNotificationStoreForTests(): void {
  notifications.clear();
  routings.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  notificationCounter = 0;
  routingCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  reportCounter = 0;
}

export function nextNotificationId(): string {
  notificationCounter += 1;
  return `fnotif-${notificationCounter.toString().padStart(4, '0')}`;
}

export function nextNotificationRoutingId(): string {
  routingCounter += 1;
  return `fnotifrouting-${routingCounter.toString().padStart(4, '0')}`;
}

export function nextNotificationLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `fnotiflc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextNotificationHistoryEntryId(): string {
  historyCounter += 1;
  return `fnotifhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextNotificationReportId(): string {
  reportCounter += 1;
  return `fnotifrpt-${reportCounter.toString().padStart(4, '0')}`;
}

export function storeNotification(notification: FounderNotification): void {
  notifications.set(notification.notificationId, notification);
}

export function getStoredNotification(notificationId: string): FounderNotification | null {
  return notifications.get(notificationId) ?? null;
}

export function listStoredNotifications(): FounderNotification[] {
  return [...notifications.values()];
}

export function storeNotificationRouting(routing: NotificationRouting): void {
  routings.set(routing.routingId, routing);
}

export function getStoredNotificationRouting(routingId: string): NotificationRouting | null {
  return routings.get(routingId) ?? null;
}

export function listStoredNotificationRoutings(): NotificationRouting[] {
  return [...routings.values()];
}

export function storeNotificationLifecycleEvent(event: NotificationLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredNotificationLifecycleEvents(): NotificationLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeNotificationHistoryEntry(entry: NotificationHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredNotificationHistoryEntries(): NotificationHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendNotificationStateHistory(entry: NotificationStateHistoryEntry): void {
  const existing = stateHistory.get(entry.notificationId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.notificationId, existing);
}

export function getStoredNotificationStateHistory(notificationId: string): NotificationStateHistoryEntry[] {
  return [...(stateHistory.get(notificationId) ?? [])];
}

export function resetFounderNotificationReportCounterForTests(): void {
  reportCounter = 0;
}
