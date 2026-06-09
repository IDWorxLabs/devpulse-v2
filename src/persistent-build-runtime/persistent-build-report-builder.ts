/**
 * Persistent Build Runtime Foundation — report builder.
 */

import {
  listStoredPersistentBuilds,
  listStoredPersistentBuildSessions,
  listStoredPersistentBuildLifecycleEvents,
  getStoredPersistentBuildStateHistory,
} from './persistent-build-store.js';
import { getPersistentBuildHistory } from './persistent-build-history.js';
import { getPersistentBuildDiagnostics } from './persistent-build-diagnostics.js';
import { detectBuildRuntimeMismatch } from './persistent-build-cloud-bridge.js';
import { detectBuildWorkspaceMismatch } from './persistent-build-workspace-bridge.js';
import { isPersistentBuildRuntimeFoundationQuestion } from './persistent-build-types.js';
import type { PersistentBuildReport, PersistentBuildReportType } from './persistent-build-types.js';

let reportCounter = 0;

export function resetPersistentBuildReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextPersistentBuildReportId(): string {
  reportCounter += 1;
  return `pbrpt-${reportCounter.toString().padStart(4, '0')}`;
}

function buildReport(
  reportType: PersistentBuildReportType,
  summary: string,
  findings: string[],
): PersistentBuildReport {
  const builds = listStoredPersistentBuilds();
  const sessions = listStoredPersistentBuildSessions();
  return {
    reportId: nextPersistentBuildReportId(),
    reportType,
    generatedAt: Date.now(),
    buildCount: builds.length,
    sessionCount: sessions.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildPersistentBuildInventoryReport(): PersistentBuildReport {
  const builds = listStoredPersistentBuilds();
  const findings = builds.map(
    (b) => `${b.buildId} — ${b.buildMetadata.buildName} (${b.buildType}) state=${b.buildState}`,
  );
  return buildReport(
    'PERSISTENT_BUILD_INVENTORY_REPORT',
    `Persistent build inventory — ${builds.length} builds (authority only)`,
    findings.length > 0 ? findings : ['No builds registered yet'],
  );
}

export function buildPersistentBuildOwnershipReport(): PersistentBuildReport {
  const builds = listStoredPersistentBuilds();
  const findings = builds.map(
    (b) =>
      `${b.buildId}: owner=${b.buildOwner.ownerModule} project=${b.buildOwner.projectId} workspace=${b.buildOwner.workspaceId} runtime=${b.buildOwner.runtimeId}`,
  );
  return buildReport(
    'PERSISTENT_BUILD_OWNERSHIP_REPORT',
    `Build ownership — ${builds.length} records`,
    findings.length > 0 ? findings : ['No ownership records'],
  );
}

export function buildPersistentBuildLifecycleReport(): PersistentBuildReport {
  const events = listStoredPersistentBuildLifecycleEvents();
  const findings = events.map((e) => `${e.buildId}: ${e.eventType} (${e.previousState} → ${e.newState})`);
  return buildReport(
    'PERSISTENT_BUILD_LIFECYCLE_REPORT',
    `Build lifecycle — ${events.length} events`,
    findings.length > 0 ? findings : ['No lifecycle events'],
  );
}

export function buildPersistentBuildStateReport(): PersistentBuildReport {
  const builds = listStoredPersistentBuilds();
  const findings = builds.map((b) => {
    const history = getStoredPersistentBuildStateHistory(b.buildId);
    return `${b.buildId}: state=${b.buildState} transitions=${history.length}`;
  });
  return buildReport(
    'PERSISTENT_BUILD_STATE_REPORT',
    `Build state — ${builds.length} builds tracked`,
    findings.length > 0 ? findings : ['No state records'],
  );
}

export function buildPersistentBuildProgressReport(): PersistentBuildReport {
  const builds = listStoredPersistentBuilds();
  const findings = builds.map(
    (b) => `${b.buildId}: ${b.buildProgress.progressPercent}% — ${b.buildProgress.progressState} — ${b.buildProgress.lastProgressMessage}`,
  );
  return buildReport(
    'PERSISTENT_BUILD_PROGRESS_REPORT',
    `Build progress metadata — ${builds.length} builds`,
    findings.length > 0 ? findings : ['No progress records'],
  );
}

export function buildPersistentBuildContextReport(): PersistentBuildReport {
  const builds = listStoredPersistentBuilds();
  const findings = builds.map(
    (b) => `${b.buildId}: goal=${b.buildContext.currentGoal.slice(0, 80)} step=${b.buildContext.currentStep ?? 'none'}`,
  );
  return buildReport(
    'PERSISTENT_BUILD_CONTEXT_REPORT',
    `Build context metadata — ${builds.length} builds`,
    findings.length > 0 ? findings : ['No context records'],
  );
}

export function buildPersistentBuildResumeReport(): PersistentBuildReport {
  const builds = listStoredPersistentBuilds();
  const findings = builds.map(
    (b) =>
      `${b.buildId}: canResume=${b.buildResumeState.canResume} checkpoint=${b.buildResumeState.resumeCheckpointId ?? 'none'} risk=${b.buildResumeState.resumeRiskLevel}`,
  );
  return buildReport(
    'PERSISTENT_BUILD_RESUME_REPORT',
    `Build resume metadata — ${builds.length} builds`,
    findings.length > 0 ? findings : ['No resume records'],
  );
}

export function buildPersistentBuildCloudLinkReport(): PersistentBuildReport {
  const builds = listStoredPersistentBuilds();
  const findings = builds.map((b) => {
    const mismatch = detectBuildRuntimeMismatch(b.buildId);
    return `${b.buildId} → runtime ${b.buildCloudRuntimeLink.runtimeId} mismatch=${mismatch}`;
  });
  return buildReport(
    'PERSISTENT_BUILD_CLOUD_LINK_REPORT',
    `Cloud runtime links via Cloud Runtime Foundation — ${builds.length} builds`,
    findings.length > 0 ? findings : ['No cloud links'],
  );
}

export function buildPersistentBuildWorkspaceLinkReport(): PersistentBuildReport {
  const builds = listStoredPersistentBuilds();
  const findings = builds.map((b) => {
    const mismatch = detectBuildWorkspaceMismatch(b.buildId);
    return `${b.buildId} → workspace ${b.buildWorkspaceLink.workspaceId} mismatch=${mismatch}`;
  });
  return buildReport(
    'PERSISTENT_BUILD_WORKSPACE_LINK_REPORT',
    `Workspace links via Workspace Hosting Foundation — ${builds.length} builds`,
    findings.length > 0 ? findings : ['No workspace links'],
  );
}

export function buildPersistentBuildHistoryReport(): PersistentBuildReport {
  const history = getPersistentBuildHistory();
  const findings = history.slice(-20).map((h) => `${h.category}: ${h.summary}`);
  return buildReport(
    'PERSISTENT_BUILD_HISTORY_REPORT',
    `Build history — ${history.length} entries`,
    findings.length > 0 ? findings : ['No history entries'],
  );
}

export function buildPersistentBuildDiagnosticsReport(): PersistentBuildReport {
  const diag = getPersistentBuildDiagnostics();
  const findings = [
    `Authority active: ${diag.persistentBuildAuthorityActive}`,
    `Registered builds: ${diag.registeredBuildCount}`,
    `Active sessions: ${diag.activeSessionCount}`,
    `Ready builds: ${diag.readyBuildCount}`,
    `Paused builds: ${diag.pausedBuildCount}`,
    `Waiting builds: ${diag.waitingBuildCount}`,
    `Blocked builds: ${diag.blockedBuildCount}`,
    `Duplicate risks: ${diag.duplicateRiskCount}`,
    `Runtime mismatches: ${diag.runtimeMismatchCount}`,
    `Workspace mismatches: ${diag.workspaceMismatchCount}`,
  ];
  return buildReport(
    'PERSISTENT_BUILD_DIAGNOSTICS_REPORT',
    'Persistent build diagnostics — authority validation only',
    findings,
  );
}

export function buildAllPersistentBuildReports(): PersistentBuildReport[] {
  return [
    buildPersistentBuildInventoryReport(),
    buildPersistentBuildOwnershipReport(),
    buildPersistentBuildLifecycleReport(),
    buildPersistentBuildStateReport(),
    buildPersistentBuildProgressReport(),
    buildPersistentBuildContextReport(),
    buildPersistentBuildResumeReport(),
    buildPersistentBuildCloudLinkReport(),
    buildPersistentBuildWorkspaceLinkReport(),
    buildPersistentBuildHistoryReport(),
    buildPersistentBuildDiagnosticsReport(),
  ];
}

export function composePersistentBuildResponse(
  query: string,
  build: import('./persistent-build-types.js').PersistentBuild | null,
  session: import('./persistent-build-types.js').PersistentBuildSession | null,
  reports: PersistentBuildReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Persistent Build Runtime Foundation: BLOCKED' : 'Persistent Build Runtime Foundation: READY');
  lines.push(`Query: ${query}`);
  lines.push('Authority only — no real builds, cloud workers, or file mutation.');

  if (build) {
    lines.push(`Build: ${build.buildId} (${build.buildMetadata.buildName})`);
    lines.push(`Type: ${build.buildType} | State: ${build.buildState} | Progress: ${build.buildProgress.progressPercent}%`);
    lines.push(
      `Links: project=${build.buildOwner.projectId} workspace=${build.buildOwner.workspaceId} runtime=${build.buildOwner.runtimeId}`,
    );
    lines.push(`Context goal: ${build.buildContext.currentGoal}`);
    lines.push(`Can resume: ${build.buildResumeState.canResume}`);
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

export function buildPersistentBuildFailureContext(query: string): Array<{
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}> {
  if (!isPersistentBuildRuntimeFoundationQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: Array<{
    title: string;
    description: string;
    sourceSystem: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> = [
    {
      title: 'Persistent build foundation: authority only',
      description: 'Phase 17.3 long-running build session authority without execution or file mutation',
      sourceSystem: 'persistent_build_runtime_foundation',
      severity: 'LOW',
    },
  ];

  if (lower.includes('blocked') || lower.includes('failed')) {
    records.push({
      title: 'Persistent build blocked',
      description: 'Persistent build foundation gates failed — inspect ownership, runtime/workspace links, and context',
      sourceSystem: 'persistent_build_runtime_foundation',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('duplicate') || lower.includes('mismatch')) {
    records.push({
      title: 'Persistent build risk detected',
      description: 'DUPLICATE_PERSISTENT_BUILD_RISK or link mismatch — cloud/workspace foundations remain source of truth',
      sourceSystem: 'persistent_build_runtime_foundation',
      severity: 'HIGH',
    });
  }

  return records;
}
