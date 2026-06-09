/**
 * Cloud Monitoring Foundation — lifecycle tracking (no real monitoring).
 */

import {
  nextMonitoringLifecycleEventId,
  storeCloudMonitoringLifecycleEvent,
  getStoredCloudMonitoringRecord,
  listStoredCloudMonitoringLifecycleEvents,
} from './cloud-monitoring-store.js';
import { setMonitoringState } from './cloud-monitoring-state-manager.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type {
  CloudMonitoringLifecycleEvent,
  CloudMonitoringLifecycleEventType,
  CloudMonitoringState,
} from './cloud-monitoring-types.js';
import { CLOUD_MONITORING_FOUNDATION_OWNER_MODULE } from './cloud-monitoring-types.js';

const EVENT_STATE_MAP: Record<CloudMonitoringLifecycleEventType, CloudMonitoringState> = {
  MONITORING_CREATED: 'CREATED',
  MONITORING_INITIALIZED: 'INITIALIZING',
  MONITORING_ACTIVATED: 'MONITORING_ACTIVE',
  HEALTH_UPDATED: 'HEALTH_UPDATED',
  ALERT_CREATED: 'ALERT_CREATED',
  ALERT_ACKNOWLEDGED: 'ALERT_ACKNOWLEDGED',
  MONITORING_LINKED_TO_RUNTIME: 'READY',
  MONITORING_LINKED_TO_WORKSPACE: 'READY',
  MONITORING_LINKED_TO_BUILD: 'READY',
  MONITORING_LINKED_TO_VERIFICATION: 'READY',
  MONITORING_LINKED_TO_RECOVERY: 'READY',
  MONITORING_COMPLETED: 'COMPLETED',
  MONITORING_ARCHIVED: 'ARCHIVED',
  MONITORING_FAILED: 'FAILED',
};

export function recordCloudMonitoringLifecycleEvent(
  monitoringId: string,
  eventType: CloudMonitoringLifecycleEventType,
  notes = '',
): CloudMonitoringLifecycleEvent | null {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return null;

  const targetState = EVENT_STATE_MAP[eventType];
  const previousState = record.monitoringState;

  const event: CloudMonitoringLifecycleEvent = {
    eventId: nextMonitoringLifecycleEventId(),
    monitoringId,
    eventType,
    previousState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    notes,
  };
  storeCloudMonitoringLifecycleEvent(event);

  if (previousState !== targetState) {
    setMonitoringState(monitoringId, targetState, eventType === 'MONITORING_INITIALIZED');
  }

  const historyCategory =
    eventType === 'HEALTH_UPDATED'
      ? 'HEALTH'
      : eventType === 'ALERT_CREATED' || eventType === 'ALERT_ACKNOWLEDGED'
        ? 'ALERT'
        : 'LIFECYCLE';

  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: historyCategory,
    summary: `${eventType}: ${previousState} → ${targetState}${notes ? ` — ${notes}` : ''}`,
    scopeUsed: monitoringId,
  });

  return event;
}

export function initializeCloudMonitoring(monitoringId: string): CloudMonitoringLifecycleEvent | null {
  return recordCloudMonitoringLifecycleEvent(monitoringId, 'MONITORING_INITIALIZED', 'Authority initialization');
}

export function activateCloudMonitoring(monitoringId: string): CloudMonitoringLifecycleEvent | null {
  return recordCloudMonitoringLifecycleEvent(monitoringId, 'MONITORING_ACTIVATED', 'Monitoring metadata active — no infrastructure polling');
}

export function recordHealthUpdated(monitoringId: string, notes: string): CloudMonitoringLifecycleEvent | null {
  return recordCloudMonitoringLifecycleEvent(monitoringId, 'HEALTH_UPDATED', notes);
}

export function recordAlertCreated(monitoringId: string, alertId: string): CloudMonitoringLifecycleEvent | null {
  return recordCloudMonitoringLifecycleEvent(monitoringId, 'ALERT_CREATED', `Alert ${alertId} created`);
}

export function recordAlertAcknowledged(monitoringId: string, alertId: string): CloudMonitoringLifecycleEvent | null {
  return recordCloudMonitoringLifecycleEvent(monitoringId, 'ALERT_ACKNOWLEDGED', `Alert ${alertId} acknowledged`);
}

export function completeCloudMonitoring(monitoringId: string): CloudMonitoringLifecycleEvent | null {
  return recordCloudMonitoringLifecycleEvent(monitoringId, 'MONITORING_COMPLETED', 'Monitoring authority complete');
}

export function archiveCloudMonitoring(monitoringId: string): CloudMonitoringLifecycleEvent | null {
  return recordCloudMonitoringLifecycleEvent(monitoringId, 'MONITORING_ARCHIVED', 'Monitoring archived');
}

export function failCloudMonitoring(monitoringId: string, reason: string): CloudMonitoringLifecycleEvent | null {
  return recordCloudMonitoringLifecycleEvent(monitoringId, 'MONITORING_FAILED', reason);
}

export function listLifecycleEventsForMonitoring(monitoringId: string): CloudMonitoringLifecycleEvent[] {
  return listStoredCloudMonitoringLifecycleEvents().filter((e) => e.monitoringId === monitoringId);
}
