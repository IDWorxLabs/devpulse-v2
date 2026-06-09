/**
 * Cloud Monitoring Foundation — state manager.
 */

import {
  getStoredCloudMonitoringRecord,
  appendCloudMonitoringStateHistory,
  storeCloudMonitoringRecord,
  getStoredCloudMonitoringStateHistory,
} from './cloud-monitoring-store.js';
import type { CloudMonitoringState, CloudMonitoringStateHistoryEntry } from './cloud-monitoring-types.js';
import { isValidCloudMonitoringStateTransition } from './cloud-monitoring-types.js';

export function setMonitoringState(
  monitoringId: string,
  newState: CloudMonitoringState,
  force = false,
): { ok: boolean; previousState: CloudMonitoringState | null; error?: string } {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) {
    return { ok: false, previousState: null, error: `Monitoring record not found: ${monitoringId}` };
  }

  const previousState = record.monitoringState;
  if (!force && !isValidCloudMonitoringStateTransition(previousState, newState)) {
    return {
      ok: false,
      previousState,
      error: `Invalid state transition: ${previousState} → ${newState}`,
    };
  }

  storeCloudMonitoringRecord({
    ...record,
    monitoringState: newState,
    monitoringStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendCloudMonitoringStateHistory({
    monitoringId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getMonitoringState(monitoringId: string): CloudMonitoringState | null {
  return getStoredCloudMonitoringRecord(monitoringId)?.monitoringState ?? null;
}

export function trackMonitoringStateHistory(monitoringId: string): CloudMonitoringStateHistoryEntry[] {
  return getStoredCloudMonitoringStateHistory(monitoringId);
}

function resolveStatusForState(
  state: CloudMonitoringState,
): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'COMPLETED' || state === 'MONITORING_ACTIVE' || state === 'HEALTH_UPDATED') return 'HEALTHY';
  if (state === 'FAILED') return 'BLOCKED';
  if (state.startsWith('WAITING_')) return 'WAITING';
  if (state === 'ALERT_CREATED' || state === 'ALERT_ACKNOWLEDGED') return 'DEGRADED';
  if (state === 'READY') return 'HEALTHY';
  return 'UNKNOWN';
}
