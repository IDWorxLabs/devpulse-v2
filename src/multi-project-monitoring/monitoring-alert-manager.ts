/**
 * Multi Project Monitoring — monitoring alerts.
 */

import type { MonitoringAlert, MonitoringAlertType } from './monitoring-types.js';
import { getCachedAlerts, setCachedAlerts } from './monitoring-cache.js';

const alerts = new Map<string, MonitoringAlert>();
const alertsByProject = new Map<string, MonitoringAlert[]>();

let alertCounter = 0;

const SEVERITY_MAP: Record<MonitoringAlertType, MonitoringAlert['severity']> = {
  FAILED_PROJECT: 'CRITICAL',
  HIGH_RISK_PROJECT: 'HIGH',
  BLOCKED_PROJECT: 'HIGH',
  ISOLATION_VIOLATION: 'CRITICAL',
  RESOURCE_CONTENTION: 'MEDIUM',
  VERIFICATION_BOTTLENECK: 'MEDIUM',
};

export function createMonitoringAlert(
  projectId: string,
  alertType: MonitoringAlertType,
  detail: string,
  severity?: MonitoringAlert['severity'],
): MonitoringAlert {
  alertCounter += 1;

  const alert: MonitoringAlert = {
    alertId: `monitoring-alert-${alertCounter}`,
    projectId,
    alertType,
    severity: severity ?? SEVERITY_MAP[alertType],
    detail,
    createdAt: Date.now(),
  };

  alerts.set(alert.alertId, alert);

  const projectAlerts = alertsByProject.get(projectId) ?? [];
  projectAlerts.push(alert);
  alertsByProject.set(projectId, projectAlerts);
  setCachedAlerts(projectId, projectAlerts);

  return alert;
}

export function getMonitoringAlerts(projectId?: string): MonitoringAlert[] {
  if (projectId) {
    const cached = getCachedAlerts(projectId);
    if (cached) return cached;
    const result = alertsByProject.get(projectId) ?? [];
    setCachedAlerts(projectId, result);
    return result;
  }
  return [...alerts.values()];
}

export function getMonitoringAlertCount(): number {
  return alerts.size;
}

export function resetMonitoringAlertManagerForTests(): void {
  alerts.clear();
  alertsByProject.clear();
  alertCounter = 0;
}
