/**
 * Cloud Monitoring Foundation — diagnostics tracker.
 */

import { listStoredCloudMonitoringRecords, listStoredCloudMonitoringSessions } from './cloud-monitoring-store.js';
import { detectMonitoringRuntimeMismatch } from './cloud-monitoring-runtime-bridge.js';
import { detectMonitoringWorkspaceMismatch } from './cloud-monitoring-workspace-bridge.js';
import { detectMonitoringBuildMismatch } from './cloud-monitoring-build-bridge.js';
import { detectMonitoringVerificationMismatch } from './cloud-monitoring-verification-bridge.js';
import { detectMonitoringRecoveryMismatch } from './cloud-monitoring-recovery-bridge.js';
import type { CloudMonitoringDiagnostics, CloudMonitoringState } from './cloud-monitoring-types.js';

let diagnostics: CloudMonitoringDiagnostics = {
  cloudMonitoringAuthorityActive: false,
  registeredMonitoringCount: 0,
  activeSessionCount: 0,
  activeMonitoringCount: 0,
  healthUpdatedCount: 0,
  openAlertCount: 0,
  blockedMonitoringCount: 0,
  duplicateRiskCount: 0,
  runtimeMismatchCount: 0,
  workspaceMismatchCount: 0,
  buildMismatchCount: 0,
  verificationMismatchCount: 0,
  recoveryMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getCloudMonitoringDiagnostics(): CloudMonitoringDiagnostics {
  return { ...diagnostics };
}

export function updateCloudMonitoringDiagnostics(
  query: string,
  finalState: CloudMonitoringState | null = null,
  duplicateRiskCount = 0,
): CloudMonitoringDiagnostics {
  const records = listStoredCloudMonitoringRecords();
  const sessions = listStoredCloudMonitoringSessions();

  let runtimeMismatchCount = 0;
  let workspaceMismatchCount = 0;
  let buildMismatchCount = 0;
  let verificationMismatchCount = 0;
  let recoveryMismatchCount = 0;
  let openAlertCount = 0;

  for (const r of records) {
    if (detectMonitoringRuntimeMismatch(r.monitoringId)) runtimeMismatchCount += 1;
    if (detectMonitoringWorkspaceMismatch(r.monitoringId)) workspaceMismatchCount += 1;
    if (detectMonitoringBuildMismatch(r.monitoringId)) buildMismatchCount += 1;
    if (detectMonitoringVerificationMismatch(r.monitoringId)) verificationMismatchCount += 1;
    if (detectMonitoringRecoveryMismatch(r.monitoringId)) recoveryMismatchCount += 1;
    openAlertCount += r.monitoringAlerts.filter((a) => a.alertStatus === 'OPEN').length;
  }

  diagnostics = {
    cloudMonitoringAuthorityActive: records.length > 0,
    registeredMonitoringCount: records.length,
    activeSessionCount: sessions.length,
    activeMonitoringCount: records.filter((r) => r.monitoringState === 'MONITORING_ACTIVE').length,
    healthUpdatedCount: records.filter((r) => r.monitoringState === 'HEALTH_UPDATED').length,
    openAlertCount,
    blockedMonitoringCount: records.filter((r) => r.monitoringState === 'FAILED').length,
    duplicateRiskCount,
    runtimeMismatchCount,
    workspaceMismatchCount,
    buildMismatchCount,
    verificationMismatchCount,
    recoveryMismatchCount,
    lastQuery: query,
    lastState: finalState,
  };

  return getCloudMonitoringDiagnostics();
}

export function resetCloudMonitoringDiagnosticsForTests(): void {
  diagnostics = {
    cloudMonitoringAuthorityActive: false,
    registeredMonitoringCount: 0,
    activeSessionCount: 0,
    activeMonitoringCount: 0,
    healthUpdatedCount: 0,
    openAlertCount: 0,
    blockedMonitoringCount: 0,
    duplicateRiskCount: 0,
    runtimeMismatchCount: 0,
    workspaceMismatchCount: 0,
    buildMismatchCount: 0,
    verificationMismatchCount: 0,
    recoveryMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function cloudMonitoringFoundationKey(): string {
  return 'cloud_monitoring_foundation';
}
