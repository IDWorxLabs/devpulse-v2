/**
 * Cloud Runtime Foundation — report builder.
 */

import { listStoredRuntimes, listStoredSessions, listStoredLifecycleEvents } from './cloud-runtime-store.js';
import { getRuntimeHistory } from './cloud-runtime-history.js';
import { getStoredStateHistory } from './cloud-runtime-store.js';
import { getCloudRuntimeDiagnostics } from './cloud-runtime-diagnostics.js';
import { isCloudRuntimeFoundationQuestion } from './cloud-runtime-types.js';
import type {
  CloudRuntime,
  CloudRuntimeReport,
  CloudRuntimeReportType,
  CloudRuntimeSession,
  PrepareCloudRuntimeFoundationResult,
} from './cloud-runtime-types.js';

let reportCounter = 0;

export function resetCloudRuntimeReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextCloudRuntimeReportId(): string {
  reportCounter += 1;
  return `crrpt-${reportCounter.toString().padStart(4, '0')}`;
}

function buildReport(
  reportType: CloudRuntimeReportType,
  summary: string,
  findings: string[],
): CloudRuntimeReport {
  const runtimes = listStoredRuntimes();
  const sessions = listStoredSessions();
  return {
    reportId: nextCloudRuntimeReportId(),
    reportType,
    generatedAt: Date.now(),
    runtimeCount: runtimes.length,
    sessionCount: sessions.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildRuntimeInventoryReport(): CloudRuntimeReport {
  const runtimes = listStoredRuntimes();
  const findings = runtimes.map(
    (r) => `${r.runtimeId} — ${r.runtimeMetadata.runtimeName} (${r.runtimeType}) state=${r.runtimeState}`,
  );
  return buildReport(
    'RUNTIME_INVENTORY_REPORT',
    `Runtime inventory — ${runtimes.length} cloud runtimes registered (authority only)`,
    findings.length > 0 ? findings : ['No runtimes registered yet'],
  );
}

export function buildRuntimeOwnershipReport(): CloudRuntimeReport {
  const runtimes = listStoredRuntimes();
  const findings = runtimes.map(
    (r) =>
      `${r.runtimeId}: owner=${r.runtimeOwner.ownerModule} project=${r.runtimeOwner.projectId} workspace=${r.runtimeOwner.workspaceId}`,
  );
  return buildReport(
    'RUNTIME_OWNERSHIP_REPORT',
    `Runtime ownership — ${runtimes.length} ownership records`,
    findings.length > 0 ? findings : ['No ownership records'],
  );
}

export function buildRuntimeLifecycleReport(): CloudRuntimeReport {
  const events = listStoredLifecycleEvents();
  const findings = events.map(
    (e) => `${e.runtimeId}: ${e.eventType} (${e.previousState} → ${e.newState})`,
  );
  return buildReport(
    'RUNTIME_LIFECYCLE_REPORT',
    `Runtime lifecycle — ${events.length} lifecycle events tracked`,
    findings.length > 0 ? findings : ['No lifecycle events yet'],
  );
}

export function buildRuntimeStateReport(): CloudRuntimeReport {
  const runtimes = listStoredRuntimes();
  const findings = runtimes.map((r) => {
    const history = getStoredStateHistory(r.runtimeId);
    return `${r.runtimeId}: state=${r.runtimeState} transitions=${history.length}`;
  });
  return buildReport(
    'RUNTIME_STATE_REPORT',
    `Runtime state — ${runtimes.length} runtimes with state tracking`,
    findings.length > 0 ? findings : ['No state records'],
  );
}

export function buildRuntimeHistoryReport(): CloudRuntimeReport {
  const history = getRuntimeHistory();
  const findings = history.slice(-20).map((h) => `${h.category}: ${h.summary}`);
  return buildReport(
    'RUNTIME_HISTORY_REPORT',
    `Runtime history — ${history.length} history entries`,
    findings.length > 0 ? findings : ['No history entries'],
  );
}

export function buildRuntimeDiagnosticsReport(): CloudRuntimeReport {
  const diag = getCloudRuntimeDiagnostics();
  const findings = [
    `Authority active: ${diag.cloudRuntimeAuthorityActive}`,
    `Registered runtimes: ${diag.registeredRuntimeCount}`,
    `Active sessions: ${diag.activeSessionCount}`,
    `Ready runtimes: ${diag.readyRuntimeCount}`,
    `Blocked runtimes: ${diag.blockedRuntimeCount}`,
    `Duplicate risks: ${diag.duplicateRiskCount}`,
    `Last state: ${diag.lastState ?? 'none'}`,
  ];
  return buildReport(
    'RUNTIME_DIAGNOSTICS_REPORT',
    'Runtime diagnostics report — authority validation only',
    findings,
  );
}

export function buildAllCloudRuntimeReports(): CloudRuntimeReport[] {
  return [
    buildRuntimeInventoryReport(),
    buildRuntimeOwnershipReport(),
    buildRuntimeLifecycleReport(),
    buildRuntimeStateReport(),
    buildRuntimeHistoryReport(),
    buildRuntimeDiagnosticsReport(),
  ];
}

export function composeCloudRuntimeResponse(
  query: string,
  runtime: CloudRuntime | null,
  session: CloudRuntimeSession | null,
  reports: CloudRuntimeReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Cloud Runtime Foundation: BLOCKED' : 'Cloud Runtime Foundation: READY');
  lines.push(`Query: ${query}`);
  lines.push('Authority only — no builds, World 2 plans, or autonomous builder execution.');

  if (runtime) {
    lines.push(`Runtime: ${runtime.runtimeId} (${runtime.runtimeMetadata.runtimeName})`);
    lines.push(`Type: ${runtime.runtimeType} | State: ${runtime.runtimeState} | Status: ${runtime.runtimeStatus}`);
    lines.push(
      `Ownership: project=${runtime.runtimeOwner.projectId} workspace=${runtime.runtimeOwner.workspaceId}`,
    );
    lines.push(`Resumable: ${runtime.runtimeMetadata.resumable} | Monitorable: ${runtime.runtimeMetadata.monitorable}`);
  }

  if (session) {
    lines.push(`Session: ${session.sessionId} state=${session.sessionState}`);
  }

  lines.push(`Reports: ${reports.length}`);
  for (const report of reports.slice(0, 4)) {
    lines.push(`  • ${report.reportType}: ${report.summary}`);
  }

  return lines.join('\n');
}

export function buildCloudRuntimeFailureContext(query: string): Array<{
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}> {
  if (!isCloudRuntimeFoundationQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: Array<{
    title: string;
    description: string;
    sourceSystem: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> = [
    {
      title: 'Cloud runtime foundation: authority only',
      description: 'Phase 17.1 cloud runtime authority without builds or cloud execution',
      sourceSystem: 'cloud_runtime_foundation',
      severity: 'LOW',
    },
  ];

  if (lower.includes('blocked') || lower.includes('cloud runtime blocked')) {
    records.push({
      title: 'Cloud runtime blocked',
      description: 'Cloud runtime foundation gates failed — inspect ownership and duplicate runtime risks',
      sourceSystem: 'cloud_runtime_foundation',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('duplicate')) {
    records.push({
      title: 'Duplicate runtime risk',
      description: 'DUPLICATE_RUNTIME_RISK diagnostics generated — do not create parallel runtime authorities',
      sourceSystem: 'cloud_runtime_foundation',
      severity: 'HIGH',
    });
  }

  return records;
}
