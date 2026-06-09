/**
 * Cloud Recovery Foundation — report builder.
 */

import {
  listStoredCloudRecoveries,
  listStoredCloudRecoverySessions,
  listStoredCloudRecoveryLifecycleEvents,
  getStoredCloudRecoveryStateHistory,
} from './cloud-recovery-store.js';
import { getCloudRecoveryHistory } from './cloud-recovery-history.js';
import { getCloudRecoveryDiagnostics } from './cloud-recovery-diagnostics.js';
import { detectRecoveryRuntimeMismatch } from './cloud-recovery-runtime-bridge.js';
import { detectRecoveryWorkspaceMismatch } from './cloud-recovery-workspace-bridge.js';
import { detectRecoveryBuildMismatch } from './cloud-recovery-build-bridge.js';
import { detectRecoveryVerificationMismatch } from './cloud-recovery-verification-bridge.js';
import { isCloudRecoveryFoundationQuestion } from './cloud-recovery-types.js';
import type { CloudRecoveryReport, CloudRecoveryReportType } from './cloud-recovery-types.js';

let reportCounter = 0;

export function resetCloudRecoveryReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextCloudRecoveryReportId(): string {
  reportCounter += 1;
  return `crpt-${reportCounter.toString().padStart(4, '0')}`;
}

function buildReport(
  reportType: CloudRecoveryReportType,
  summary: string,
  findings: string[],
): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const sessions = listStoredCloudRecoverySessions();
  return {
    reportId: nextCloudRecoveryReportId(),
    reportType,
    generatedAt: Date.now(),
    recoveryCount: recoveries.length,
    sessionCount: sessions.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildCloudRecoveryInventoryReport(): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const findings = recoveries.map(
    (r) => `${r.recoveryId} — ${r.recoveryMetadata.recoveryName} (${r.recoveryType}) state=${r.recoveryState}`,
  );
  return buildReport(
    'CLOUD_RECOVERY_INVENTORY_REPORT',
    `Cloud recovery inventory — ${recoveries.length} records (authority only)`,
    findings.length > 0 ? findings : ['No cloud recoveries registered yet'],
  );
}

export function buildCloudRecoveryOwnershipReport(): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const findings = recoveries.map(
    (r) =>
      `${r.recoveryId}: owner=${r.recoveryOwner.ownerModule} project=${r.recoveryOwner.projectId} runtime=${r.recoveryOwner.runtimeId} workspace=${r.recoveryOwner.workspaceId} build=${r.recoveryOwner.persistentBuildId} verification=${r.recoveryOwner.verificationId}`,
  );
  return buildReport(
    'CLOUD_RECOVERY_OWNERSHIP_REPORT',
    `Cloud recovery ownership — ${recoveries.length} records`,
    findings.length > 0 ? findings : ['No ownership records'],
  );
}

export function buildCloudRecoveryLifecycleReport(): CloudRecoveryReport {
  const events = listStoredCloudRecoveryLifecycleEvents();
  const findings = events.map((e) => `${e.recoveryId}: ${e.eventType} (${e.previousState} → ${e.newState})`);
  return buildReport(
    'CLOUD_RECOVERY_LIFECYCLE_REPORT',
    `Cloud recovery lifecycle — ${events.length} events`,
    findings.length > 0 ? findings : ['No lifecycle events'],
  );
}

export function buildCloudRecoveryStateReport(): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const findings = recoveries.map((r) => {
    const history = getStoredCloudRecoveryStateHistory(r.recoveryId);
    return `${r.recoveryId}: state=${r.recoveryState} transitions=${history.length}`;
  });
  return buildReport(
    'CLOUD_RECOVERY_STATE_REPORT',
    `Cloud recovery state — ${recoveries.length} tracked`,
    findings.length > 0 ? findings : ['No state records'],
  );
}

export function buildCloudRecoveryScopeReport(): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const findings = recoveries.map(
    (r) =>
      `${r.recoveryId}: scope=${r.recoveryScope.scopeType} failure=${r.recoveryScope.failureCategory} intent=${r.recoveryScope.recoveryIntent}`,
  );
  return buildReport(
    'CLOUD_RECOVERY_SCOPE_REPORT',
    `Cloud recovery scope — ${recoveries.length} records`,
    findings.length > 0 ? findings : ['No scope records'],
  );
}

export function buildCloudRecoveryContextReport(): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const findings = recoveries.map((r) => `${r.recoveryId}: ${r.recoveryContext.contextSummary}`);
  return buildReport(
    'CLOUD_RECOVERY_CONTEXT_REPORT',
    `Cloud recovery context — ${recoveries.length} records`,
    findings.length > 0 ? findings : ['No context records'],
  );
}

export function buildCloudRecoveryRuntimeLinkReport(): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const findings = recoveries.map(
    (r) =>
      `${r.recoveryId}: runtime=${r.recoveryRuntimeLink.runtimeId} mismatch=${detectRecoveryRuntimeMismatch(r.recoveryId)}`,
  );
  return buildReport(
    'CLOUD_RECOVERY_RUNTIME_LINK_REPORT',
    `Runtime links — ${recoveries.length} recoveries`,
    findings.length > 0 ? findings : ['No runtime links'],
  );
}

export function buildCloudRecoveryWorkspaceLinkReport(): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const findings = recoveries.map(
    (r) =>
      `${r.recoveryId}: workspace=${r.recoveryWorkspaceLink.workspaceId} mismatch=${detectRecoveryWorkspaceMismatch(r.recoveryId)}`,
  );
  return buildReport(
    'CLOUD_RECOVERY_WORKSPACE_LINK_REPORT',
    `Workspace links — ${recoveries.length} recoveries`,
    findings.length > 0 ? findings : ['No workspace links'],
  );
}

export function buildCloudRecoveryBuildLinkReport(): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const findings = recoveries.map(
    (r) =>
      `${r.recoveryId}: build=${r.recoveryPersistentBuildLink.persistentBuildId} mismatch=${detectRecoveryBuildMismatch(r.recoveryId)}`,
  );
  return buildReport(
    'CLOUD_RECOVERY_BUILD_LINK_REPORT',
    `Persistent build links — ${recoveries.length} recoveries`,
    findings.length > 0 ? findings : ['No build links'],
  );
}

export function buildCloudRecoveryVerificationLinkReport(): CloudRecoveryReport {
  const recoveries = listStoredCloudRecoveries();
  const findings = recoveries.map(
    (r) =>
      `${r.recoveryId}: verification=${r.recoveryVerificationLink.verificationId} mismatch=${detectRecoveryVerificationMismatch(r.recoveryId)}`,
  );
  return buildReport(
    'CLOUD_RECOVERY_VERIFICATION_LINK_REPORT',
    `Verification links — ${recoveries.length} recoveries`,
    findings.length > 0 ? findings : ['No verification links'],
  );
}

export function buildCloudRecoveryHistoryReport(): CloudRecoveryReport {
  const history = getCloudRecoveryHistory();
  const findings = history.slice(-20).map((e) => `${e.recoveryId} [${e.category}]: ${e.summary}`);
  return buildReport(
    'CLOUD_RECOVERY_HISTORY_REPORT',
    `Cloud recovery history — ${history.length} entries`,
    findings.length > 0 ? findings : ['No history entries'],
  );
}

export function buildCloudRecoveryDiagnosticsReport(): CloudRecoveryReport {
  const diag = getCloudRecoveryDiagnostics();
  const findings = [
    `Authority active: ${diag.cloudRecoveryAuthorityActive}`,
    `Registered: ${diag.registeredRecoveryCount}`,
    `Sessions: ${diag.activeSessionCount}`,
    `Ready: ${diag.readyRecoveryCount}`,
    `Waiting: ${diag.waitingRecoveryCount}`,
    `Blocked: ${diag.blockedRecoveryCount}`,
    `Duplicate risks: ${diag.duplicateRiskCount}`,
    `Runtime mismatches: ${diag.runtimeMismatchCount}`,
    `Workspace mismatches: ${diag.workspaceMismatchCount}`,
    `Build mismatches: ${diag.buildMismatchCount}`,
    `Verification mismatches: ${diag.verificationMismatchCount}`,
  ];
  return buildReport(
    'CLOUD_RECOVERY_DIAGNOSTICS_REPORT',
    'Cloud recovery diagnostics — authority validation only',
    findings,
  );
}

export function buildAllCloudRecoveryReports(): CloudRecoveryReport[] {
  return [
    buildCloudRecoveryInventoryReport(),
    buildCloudRecoveryOwnershipReport(),
    buildCloudRecoveryLifecycleReport(),
    buildCloudRecoveryStateReport(),
    buildCloudRecoveryScopeReport(),
    buildCloudRecoveryContextReport(),
    buildCloudRecoveryRuntimeLinkReport(),
    buildCloudRecoveryWorkspaceLinkReport(),
    buildCloudRecoveryBuildLinkReport(),
    buildCloudRecoveryVerificationLinkReport(),
    buildCloudRecoveryHistoryReport(),
    buildCloudRecoveryDiagnosticsReport(),
  ];
}

export function composeCloudRecoveryResponse(
  query: string,
  recovery: import('./cloud-recovery-types.js').CloudRecovery | null,
  session: import('./cloud-recovery-types.js').CloudRecoverySession | null,
  reports: CloudRecoveryReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Cloud Recovery Foundation: BLOCKED' : 'Cloud Recovery Foundation: READY');
  lines.push('');
  lines.push(`Query: ${query}`);
  if (recovery) {
    lines.push(`Recovery: ${recovery.recoveryId} — ${recovery.recoveryMetadata.recoveryName}`);
    lines.push(`State: ${recovery.recoveryState}`);
    lines.push(`Failure: ${recovery.recoveryMetadata.failureDescription ?? 'not registered'}`);
    lines.push(`Candidate: ${recovery.recoveryMetadata.candidateDescription ?? 'not registered'}`);
    lines.push(`Plan: ${recovery.recoveryMetadata.planDescription ?? 'not registered'}`);
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
  lines.push('Authority only — no recovery execution, rollback, cloud worker restart, or file mutation.');
  lines.push('Cloud Runtime, Workspace Hosting, Persistent Build Runtime, and Cloud Verification remain upstream sources of truth.');
  return lines.join('\n');
}

export function buildCloudRecoveryFailureContext(query: string): Array<{
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}> {
  if (!isCloudRecoveryFoundationQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: Array<{
    title: string;
    description: string;
    sourceSystem: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> = [
    {
      title: 'Cloud recovery foundation: authority only',
      description: 'Phase 17.5 cloud recovery coordination without execution, rollback, or repair',
      sourceSystem: 'cloud_recovery_foundation',
      severity: 'LOW',
    },
  ];

  if (lower.includes('blocked') || lower.includes('failed')) {
    records.push({
      title: 'Cloud recovery blocked',
      description: 'Cloud recovery foundation gates failed — inspect ownership, bridges, and scope/context alignment',
      sourceSystem: 'cloud_recovery_foundation',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('duplicate') || lower.includes('mismatch')) {
    records.push({
      title: 'Cloud recovery risk detected',
      description: 'Duplicate or mismatched cloud recovery authority — do not create parallel recovery systems',
      sourceSystem: 'cloud_recovery_foundation',
      severity: 'HIGH',
    });
  }

  return records;
}
