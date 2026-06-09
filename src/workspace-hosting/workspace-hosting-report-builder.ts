/**
 * Workspace Hosting Foundation — report builder.
 */

import {
  listStoredWorkspaces,
  listStoredWorkspaceSessions,
  listStoredWorkspaceLifecycleEvents,
  getStoredWorkspaceStateHistory,
} from './workspace-hosting-store.js';
import { getWorkspaceHistory } from './workspace-hosting-history.js';
import { getWorkspaceHostingDiagnostics } from './workspace-hosting-diagnostics.js';
import { detectRuntimeWorkspaceMismatch } from './workspace-hosting-runtime-bridge.js';
import { evaluateIsolationBoundaryRisk } from './workspace-hosting-isolation.js';
import { isWorkspaceHostingFoundationQuestion } from './workspace-hosting-types.js';
import type { WorkspaceReport, WorkspaceReportType } from './workspace-hosting-types.js';

let reportCounter = 0;

export function resetWorkspaceHostingReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextWorkspaceHostingReportId(): string {
  reportCounter += 1;
  return `whrpt-${reportCounter.toString().padStart(4, '0')}`;
}

function buildReport(
  reportType: WorkspaceReportType,
  summary: string,
  findings: string[],
): WorkspaceReport {
  const workspaces = listStoredWorkspaces();
  const sessions = listStoredWorkspaceSessions();
  return {
    reportId: nextWorkspaceHostingReportId(),
    reportType,
    generatedAt: Date.now(),
    workspaceCount: workspaces.length,
    sessionCount: sessions.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildWorkspaceInventoryReport(): WorkspaceReport {
  const workspaces = listStoredWorkspaces();
  const findings = workspaces.map(
    (w) => `${w.workspaceId} — ${w.workspaceMetadata.workspaceName} (${w.workspaceType}) state=${w.workspaceState}`,
  );
  return buildReport(
    'WORKSPACE_INVENTORY_REPORT',
    `Workspace inventory — ${workspaces.length} hosted workspaces (authority only)`,
    findings.length > 0 ? findings : ['No workspaces registered yet'],
  );
}

export function buildWorkspaceOwnershipReport(): WorkspaceReport {
  const workspaces = listStoredWorkspaces();
  const findings = workspaces.map(
    (w) =>
      `${w.workspaceId}: owner=${w.workspaceOwner.ownerModule} project=${w.workspaceOwner.projectId} runtime=${w.workspaceOwner.runtimeId}`,
  );
  return buildReport(
    'WORKSPACE_OWNERSHIP_REPORT',
    `Workspace ownership — ${workspaces.length} ownership records`,
    findings.length > 0 ? findings : ['No ownership records'],
  );
}

export function buildWorkspaceLifecycleReport(): WorkspaceReport {
  const events = listStoredWorkspaceLifecycleEvents();
  const findings = events.map(
    (e) => `${e.workspaceId}: ${e.eventType} (${e.previousState} → ${e.newState})`,
  );
  return buildReport(
    'WORKSPACE_LIFECYCLE_REPORT',
    `Workspace lifecycle — ${events.length} lifecycle events tracked`,
    findings.length > 0 ? findings : ['No lifecycle events yet'],
  );
}

export function buildWorkspaceStateReport(): WorkspaceReport {
  const workspaces = listStoredWorkspaces();
  const findings = workspaces.map((w) => {
    const history = getStoredWorkspaceStateHistory(w.workspaceId);
    return `${w.workspaceId}: state=${w.workspaceState} transitions=${history.length}`;
  });
  return buildReport(
    'WORKSPACE_STATE_REPORT',
    `Workspace state — ${workspaces.length} workspaces with state tracking`,
    findings.length > 0 ? findings : ['No state records'],
  );
}

export function buildWorkspaceIsolationReport(): WorkspaceReport {
  const workspaces = listStoredWorkspaces();
  const findings = workspaces.flatMap((w) => {
    const iso = w.workspaceIsolation;
    const risks = evaluateIsolationBoundaryRisk(w.workspaceId);
    return [
      `${w.workspaceId}: mode=${iso.isolationMode} boundary=${iso.isolationBoundary}`,
      ...risks.map((r) => `  risk: ${r}`),
    ];
  });
  return buildReport(
    'WORKSPACE_ISOLATION_REPORT',
    `Workspace isolation — metadata for ${workspaces.length} workspaces`,
    findings.length > 0 ? findings : ['No isolation metadata'],
  );
}

export function buildWorkspaceRuntimeLinkReport(): WorkspaceReport {
  const workspaces = listStoredWorkspaces();
  const findings = workspaces.map((w) => {
    const mismatch = detectRuntimeWorkspaceMismatch(w.workspaceId);
    return `${w.workspaceId} → runtime ${w.workspaceRuntimeLink.runtimeId} mismatch=${mismatch}`;
  });
  const runtimeGroups = new Map<string, number>();
  for (const w of workspaces) {
    const rid = w.workspaceRuntimeLink.runtimeId;
    runtimeGroups.set(rid, (runtimeGroups.get(rid) ?? 0) + 1);
  }
  for (const [rid, count] of runtimeGroups) {
    findings.push(`Runtime ${rid}: ${count} linked workspaces`);
  }
  return buildReport(
    'WORKSPACE_RUNTIME_LINK_REPORT',
    `Runtime links — ${workspaces.length} workspace-runtime associations via Cloud Runtime Foundation`,
    findings.length > 0 ? findings : ['No runtime links'],
  );
}

export function buildWorkspaceHistoryReport(): WorkspaceReport {
  const history = getWorkspaceHistory();
  const findings = history.slice(-20).map((h) => `${h.category}: ${h.summary}`);
  return buildReport(
    'WORKSPACE_HISTORY_REPORT',
    `Workspace history — ${history.length} history entries`,
    findings.length > 0 ? findings : ['No history entries'],
  );
}

export function buildWorkspaceDiagnosticsReport(): WorkspaceReport {
  const diag = getWorkspaceHostingDiagnostics();
  const findings = [
    `Authority active: ${diag.workspaceHostingAuthorityActive}`,
    `Registered workspaces: ${diag.registeredWorkspaceCount}`,
    `Active sessions: ${diag.activeSessionCount}`,
    `Ready workspaces: ${diag.readyWorkspaceCount}`,
    `Isolated workspaces: ${diag.isolatedWorkspaceCount}`,
    `Blocked workspaces: ${diag.blockedWorkspaceCount}`,
    `Duplicate risks: ${diag.duplicateRiskCount}`,
    `Runtime mismatches: ${diag.runtimeMismatchCount}`,
    `Last state: ${diag.lastState ?? 'none'}`,
  ];
  return buildReport(
    'WORKSPACE_DIAGNOSTICS_REPORT',
    'Workspace hosting diagnostics — authority validation only',
    findings,
  );
}

export function buildAllWorkspaceHostingReports(): WorkspaceReport[] {
  return [
    buildWorkspaceInventoryReport(),
    buildWorkspaceOwnershipReport(),
    buildWorkspaceLifecycleReport(),
    buildWorkspaceStateReport(),
    buildWorkspaceIsolationReport(),
    buildWorkspaceRuntimeLinkReport(),
    buildWorkspaceHistoryReport(),
    buildWorkspaceDiagnosticsReport(),
  ];
}

export function composeWorkspaceHostingResponse(
  query: string,
  workspace: import('./workspace-hosting-types.js').HostedWorkspace | null,
  session: import('./workspace-hosting-types.js').WorkspaceSession | null,
  reports: WorkspaceReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Workspace Hosting Foundation: BLOCKED' : 'Workspace Hosting Foundation: READY');
  lines.push(`Query: ${query}`);
  lines.push('Authority only — no builds, cloud workers, or real app deployment.');

  if (workspace) {
    lines.push(`Workspace: ${workspace.workspaceId} (${workspace.workspaceMetadata.workspaceName})`);
    lines.push(`Type: ${workspace.workspaceType} | State: ${workspace.workspaceState} | Status: ${workspace.workspaceStatus}`);
    lines.push(
      `Ownership: project=${workspace.workspaceOwner.projectId} runtime=${workspace.workspaceOwner.runtimeId}`,
    );
    lines.push(`Isolation: ${workspace.workspaceIsolation.isolationMode} | Resumable: ${workspace.workspaceMetadata.resumable}`);
    lines.push(`Evidence refs: ${workspace.workspaceVerificationLink.evidenceReferences.length} | Report refs: ${workspace.workspaceVerificationLink.reportReferences.length}`);
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

export function buildWorkspaceHostingFailureContext(query: string): Array<{
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}> {
  if (!isWorkspaceHostingFoundationQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: Array<{
    title: string;
    description: string;
    sourceSystem: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> = [
    {
      title: 'Workspace hosting foundation: authority only',
      description: 'Phase 17.2 hosted workspace authority without cloud workers or builds',
      sourceSystem: 'workspace_hosting_foundation',
      severity: 'LOW',
    },
  ];

  if (lower.includes('blocked') || lower.includes('workspace blocked')) {
    records.push({
      title: 'Workspace hosting blocked',
      description: 'Workspace hosting foundation gates failed — inspect ownership, runtime link, and isolation',
      sourceSystem: 'workspace_hosting_foundation',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('duplicate') || lower.includes('mismatch')) {
    records.push({
      title: 'Workspace risk detected',
      description: 'DUPLICATE_WORKSPACE_RISK or runtime mismatch — Cloud Runtime Foundation remains runtime source of truth',
      sourceSystem: 'workspace_hosting_foundation',
      severity: 'HIGH',
    });
  }

  return records;
}
