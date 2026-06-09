/**
 * Cloud Monitoring Foundation — alert metadata (no notifications).
 */

import { getStoredCloudMonitoringRecord, storeCloudMonitoringRecord, listStoredCloudMonitoringRecords } from './cloud-monitoring-store.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringAlert, MonitoringAlertSeverity } from './cloud-monitoring-types.js';
import { CLOUD_MONITORING_FOUNDATION_OWNER_MODULE } from './cloud-monitoring-types.js';

let alertCounter = 0;

export function resetCloudMonitoringAlertCounterForTests(): void {
  alertCounter = 0;
}

export function nextMonitoringAlertId(): string {
  alertCounter += 1;
  return `cmalt-${alertCounter.toString().padStart(4, '0')}`;
}

export function createMonitoringAlert(input: {
  monitoringId: string;
  alertType: string;
  alertSeverity?: MonitoringAlertSeverity;
  alertCategory?: string;
  alertSource?: string;
  alertReferences?: string[];
}): CloudMonitoringAlert | null {
  const record = getStoredCloudMonitoringRecord(input.monitoringId);
  if (!record) return null;

  const alert: CloudMonitoringAlert = {
    alertId: nextMonitoringAlertId(),
    monitoringId: input.monitoringId,
    alertType: input.alertType,
    alertSeverity: input.alertSeverity ?? 'MEDIUM',
    alertCategory: input.alertCategory ?? 'GENERAL',
    alertSource: input.alertSource ?? CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    alertTimestamp: Date.now(),
    alertStatus: 'OPEN',
    alertReferences: input.alertReferences ?? [],
  };

  storeCloudMonitoringRecord({
    ...record,
    monitoringAlerts: [...record.monitoringAlerts, alert],
    updatedAt: Date.now(),
  });

  recordCloudMonitoringHistoryEntry({
    monitoringId: input.monitoringId,
    category: 'ALERT',
    summary: `Alert created: ${alert.alertId} type=${alert.alertType} severity=${alert.alertSeverity}`,
    scopeUsed: alert.alertId,
  });

  return alert;
}

export function acknowledgeMonitoringAlert(monitoringId: string, alertId: string): CloudMonitoringAlert | null {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return null;

  const alert = record.monitoringAlerts.find((a) => a.alertId === alertId);
  if (!alert) return null;

  const updated: CloudMonitoringAlert = { ...alert, alertStatus: 'ACKNOWLEDGED' };
  const alerts = record.monitoringAlerts.map((a) => (a.alertId === alertId ? updated : a));

  storeCloudMonitoringRecord({ ...record, monitoringAlerts: alerts, updatedAt: Date.now() });

  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'ALERT',
    summary: `Alert acknowledged: ${alertId}`,
    scopeUsed: alertId,
  });

  return updated;
}

export function listAlertsForMonitoring(monitoringId: string): CloudMonitoringAlert[] {
  return getStoredCloudMonitoringRecord(monitoringId)?.monitoringAlerts ?? [];
}

export function validateMonitoringAlert(alert: CloudMonitoringAlert): string[] {
  const issues: string[] = [];
  if (!alert.alertType?.trim()) issues.push('Missing alert type');
  if (!alert.alertCategory?.trim()) issues.push('Missing alert category');
  return issues;
}

export function countOpenAlerts(): number {
  let count = 0;
  for (const r of listStoredCloudMonitoringRecords()) {
    count += r.monitoringAlerts.filter((a) => a.alertStatus === 'OPEN').length;
  }
  return count;
}
