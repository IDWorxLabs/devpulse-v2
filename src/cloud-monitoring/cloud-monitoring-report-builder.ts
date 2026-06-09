/**
 * Cloud Monitoring Foundation — report builder.
 */

import {
  listStoredCloudMonitoringRecords,
  listStoredCloudMonitoringSessions,
  listStoredCloudMonitoringLifecycleEvents,
} from './cloud-monitoring-store.js';
import { getCloudMonitoringHistory } from './cloud-monitoring-history.js';
import { getCloudMonitoringDiagnostics } from './cloud-monitoring-diagnostics.js';
import { detectMonitoringRuntimeMismatch } from './cloud-monitoring-runtime-bridge.js';
import { detectMonitoringWorkspaceMismatch } from './cloud-monitoring-workspace-bridge.js';
import { detectMonitoringBuildMismatch } from './cloud-monitoring-build-bridge.js';
import { detectMonitoringVerificationMismatch } from './cloud-monitoring-verification-bridge.js';
import { detectMonitoringRecoveryMismatch } from './cloud-monitoring-recovery-bridge.js';
import { isCloudMonitoringFoundationQuestion } from './cloud-monitoring-types.js';
import type { CloudMonitoringReport, CloudMonitoringReportType } from './cloud-monitoring-types.js';

let reportCounter = 0;

export function resetCloudMonitoringReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextCloudMonitoringReportId(): string {
  reportCounter += 1;
  return `cmrpt-${reportCounter.toString().padStart(4, '0')}`;
}

function buildReport(
  reportType: CloudMonitoringReportType,
  summary: string,
  findings: string[],
): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const sessions = listStoredCloudMonitoringSessions();
  return {
    reportId: nextCloudMonitoringReportId(),
    reportType,
    generatedAt: Date.now(),
    monitoringCount: records.length,
    sessionCount: sessions.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildCloudMonitoringInventoryReport(): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const findings = records.map(
    (r) => `${r.monitoringId} — ${r.monitoringMetadata.monitoringName} (${r.monitoringType}) state=${r.monitoringState}`,
  );
  return buildReport(
    'CLOUD_MONITORING_INVENTORY_REPORT',
    `Cloud monitoring inventory — ${records.length} records (authority only)`,
    findings.length > 0 ? findings : ['No cloud monitoring records registered yet'],
  );
}

export function buildCloudMonitoringHealthReport(): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const findings = records.map(
    (r) =>
      `${r.monitoringId}: status=${r.monitoringHealth.healthStatus} score=${r.monitoringHealth.healthScore} category=${r.monitoringHealth.healthCategory}`,
  );
  return buildReport(
    'CLOUD_MONITORING_HEALTH_REPORT',
    `Cloud monitoring health — ${records.length} records`,
    findings.length > 0 ? findings : ['No health records'],
  );
}

export function buildCloudMonitoringAlertReport(): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const findings = records.flatMap((r) =>
    r.monitoringAlerts.map(
      (a) => `${r.monitoringId}: ${a.alertId} type=${a.alertType} severity=${a.alertSeverity} status=${a.alertStatus}`,
    ),
  );
  return buildReport(
    'CLOUD_MONITORING_ALERT_REPORT',
    `Cloud monitoring alerts — ${findings.length} alerts`,
    findings.length > 0 ? findings : ['No alert records'],
  );
}

export function buildCloudMonitoringLifecycleReport(): CloudMonitoringReport {
  const events = listStoredCloudMonitoringLifecycleEvents();
  const findings = events.map((e) => `${e.monitoringId}: ${e.eventType} (${e.previousState} → ${e.newState})`);
  return buildReport(
    'CLOUD_MONITORING_LIFECYCLE_REPORT',
    `Cloud monitoring lifecycle — ${events.length} events`,
    findings.length > 0 ? findings : ['No lifecycle events'],
  );
}

export function buildCloudMonitoringContextReport(): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const findings = records.map((r) => `${r.monitoringId}: ${r.monitoringContext.contextSummary}`);
  return buildReport(
    'CLOUD_MONITORING_CONTEXT_REPORT',
    `Cloud monitoring context — ${records.length} records`,
    findings.length > 0 ? findings : ['No context records'],
  );
}

export function buildCloudMonitoringRuntimeReport(): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const findings = records.map(
    (r) =>
      `${r.monitoringId}: runtime=${r.monitoringRuntimeLink.runtimeId} mismatch=${detectMonitoringRuntimeMismatch(r.monitoringId)}`,
  );
  return buildReport(
    'CLOUD_MONITORING_RUNTIME_REPORT',
    `Runtime links — ${records.length} monitoring records`,
    findings.length > 0 ? findings : ['No runtime links'],
  );
}

export function buildCloudMonitoringWorkspaceReport(): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const findings = records.map(
    (r) =>
      `${r.monitoringId}: workspace=${r.monitoringWorkspaceLink.workspaceId} mismatch=${detectMonitoringWorkspaceMismatch(r.monitoringId)}`,
  );
  return buildReport(
    'CLOUD_MONITORING_WORKSPACE_REPORT',
    `Workspace links — ${records.length} monitoring records`,
    findings.length > 0 ? findings : ['No workspace links'],
  );
}

export function buildCloudMonitoringBuildReport(): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const findings = records.map(
    (r) =>
      `${r.monitoringId}: build=${r.monitoringBuildLink.persistentBuildId} mismatch=${detectMonitoringBuildMismatch(r.monitoringId)}`,
  );
  return buildReport(
    'CLOUD_MONITORING_BUILD_REPORT',
    `Persistent build links — ${records.length} monitoring records`,
    findings.length > 0 ? findings : ['No build links'],
  );
}

export function buildCloudMonitoringVerificationReport(): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const findings = records.map(
    (r) =>
      `${r.monitoringId}: verification=${r.monitoringVerificationLink.verificationId} mismatch=${detectMonitoringVerificationMismatch(r.monitoringId)}`,
  );
  return buildReport(
    'CLOUD_MONITORING_VERIFICATION_REPORT',
    `Verification links — ${records.length} monitoring records`,
    findings.length > 0 ? findings : ['No verification links'],
  );
}

export function buildCloudMonitoringRecoveryReport(): CloudMonitoringReport {
  const records = listStoredCloudMonitoringRecords();
  const findings = records.map(
    (r) =>
      `${r.monitoringId}: recovery=${r.monitoringRecoveryLink.recoveryId} mismatch=${detectMonitoringRecoveryMismatch(r.monitoringId)}`,
  );
  return buildReport(
    'CLOUD_MONITORING_RECOVERY_REPORT',
    `Recovery links — ${records.length} monitoring records`,
    findings.length > 0 ? findings : ['No recovery links'],
  );
}

export function buildCloudMonitoringHistoryReport(): CloudMonitoringReport {
  const history = getCloudMonitoringHistory();
  const findings = history.slice(-20).map((e) => `${e.monitoringId} [${e.category}]: ${e.summary}`);
  return buildReport(
    'CLOUD_MONITORING_HISTORY_REPORT',
    `Cloud monitoring history — ${history.length} entries`,
    findings.length > 0 ? findings : ['No history entries'],
  );
}

export function buildCloudMonitoringDiagnosticsReport(): CloudMonitoringReport {
  const diag = getCloudMonitoringDiagnostics();
  const findings = [
    `Authority active: ${diag.cloudMonitoringAuthorityActive}`,
    `Registered: ${diag.registeredMonitoringCount}`,
    `Sessions: ${diag.activeSessionCount}`,
    `Active: ${diag.activeMonitoringCount}`,
    `Health updated: ${diag.healthUpdatedCount}`,
    `Open alerts: ${diag.openAlertCount}`,
    `Blocked: ${diag.blockedMonitoringCount}`,
    `Duplicate risks: ${diag.duplicateRiskCount}`,
    `Runtime mismatches: ${diag.runtimeMismatchCount}`,
    `Workspace mismatches: ${diag.workspaceMismatchCount}`,
    `Build mismatches: ${diag.buildMismatchCount}`,
    `Verification mismatches: ${diag.verificationMismatchCount}`,
    `Recovery mismatches: ${diag.recoveryMismatchCount}`,
  ];
  return buildReport(
    'CLOUD_MONITORING_DIAGNOSTICS_REPORT',
    'Cloud monitoring diagnostics — authority validation only',
    findings,
  );
}

export function buildAllCloudMonitoringReports(): CloudMonitoringReport[] {
  return [
    buildCloudMonitoringInventoryReport(),
    buildCloudMonitoringHealthReport(),
    buildCloudMonitoringAlertReport(),
    buildCloudMonitoringLifecycleReport(),
    buildCloudMonitoringContextReport(),
    buildCloudMonitoringRuntimeReport(),
    buildCloudMonitoringWorkspaceReport(),
    buildCloudMonitoringBuildReport(),
    buildCloudMonitoringVerificationReport(),
    buildCloudMonitoringRecoveryReport(),
    buildCloudMonitoringHistoryReport(),
    buildCloudMonitoringDiagnosticsReport(),
  ];
}

export function composeCloudMonitoringResponse(
  query: string,
  record: import('./cloud-monitoring-types.js').CloudMonitoringRecord | null,
  session: import('./cloud-monitoring-types.js').CloudMonitoringSession | null,
  reports: CloudMonitoringReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Cloud Monitoring Foundation: BLOCKED' : 'Cloud Monitoring Foundation: READY');
  lines.push('');
  lines.push(`Query: ${query}`);
  if (record) {
    lines.push(`Monitoring: ${record.monitoringId} — ${record.monitoringMetadata.monitoringName}`);
    lines.push(`State: ${record.monitoringState}`);
    lines.push(`Health: ${record.monitoringHealth.healthStatus} (score ${record.monitoringHealth.healthScore})`);
    lines.push(`Alerts: ${record.monitoringAlerts.length}`);
  }
  if (session) {
    lines.push(`Session: ${session.sessionId} — ${session.sessionState}`);
  }
  lines.push('');
  lines.push('Reports:');
  for (const r of reports) {
    lines.push(`  ${r.reportType}: ${r.summary}`);
  }
  lines.push('');
  lines.push('Authority only — no real infrastructure monitoring, cloud provider connections, or notifications.');
  lines.push('Cloud Runtime, Workspace Hosting, Persistent Build Runtime, Cloud Verification, and Cloud Recovery remain upstream sources of truth.');
  return lines.join('\n');
}

export function buildCloudMonitoringFailureContext(query: string): Array<{
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}> {
  if (!isCloudMonitoringFoundationQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: Array<{
    title: string;
    description: string;
    sourceSystem: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> = [
    {
      title: 'Cloud monitoring foundation: authority only',
      description: 'Phase 17.6 cloud monitoring coordination without infrastructure polling or notifications',
      sourceSystem: 'cloud_monitoring_foundation',
      severity: 'LOW',
    },
  ];

  if (lower.includes('blocked') || lower.includes('failed')) {
    records.push({
      title: 'Cloud monitoring blocked',
      description: 'Cloud monitoring foundation gates failed — inspect ownership, bridges, health, and alerts',
      sourceSystem: 'cloud_monitoring_foundation',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('duplicate') || lower.includes('mismatch')) {
    records.push({
      title: 'Cloud monitoring risk detected',
      description: 'Duplicate or mismatched cloud monitoring authority — do not create parallel monitoring systems',
      sourceSystem: 'cloud_monitoring_foundation',
      severity: 'HIGH',
    });
  }

  return records;
}
