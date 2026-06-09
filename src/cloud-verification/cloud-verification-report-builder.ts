/**
 * Cloud Verification Foundation — report builder.
 */

import {
  listStoredCloudVerifications,
  listStoredCloudVerificationSessions,
  listStoredCloudVerificationLifecycleEvents,
  getStoredCloudVerificationStateHistory,
} from './cloud-verification-store.js';
import { getCloudVerificationHistory } from './cloud-verification-history.js';
import { getCloudVerificationDiagnostics } from './cloud-verification-diagnostics.js';
import { detectCloudVerificationRuntimeMismatch } from './cloud-verification-runtime-bridge.js';
import { detectCloudVerificationWorkspaceMismatch } from './cloud-verification-workspace-bridge.js';
import { detectCloudVerificationBuildMismatch } from './cloud-verification-build-bridge.js';
import { detectEvidenceMismatch } from './cloud-verification-evidence-bridge.js';
import { detectReportMismatch } from './cloud-verification-report-bridge.js';
import { detectUnifiedVerificationMismatch } from './cloud-verification-unified-entry-bridge.js';
import { isCloudVerificationFoundationQuestion } from './cloud-verification-types.js';
import type { CloudVerificationReport, CloudVerificationReportType } from './cloud-verification-types.js';

let reportCounter = 0;

export function resetCloudVerificationReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextCloudVerificationReportId(): string {
  reportCounter += 1;
  return `cvrpt-${reportCounter.toString().padStart(4, '0')}`;
}

function buildReport(
  reportType: CloudVerificationReportType,
  summary: string,
  findings: string[],
): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const sessions = listStoredCloudVerificationSessions();
  return {
    reportId: nextCloudVerificationReportId(),
    reportType,
    generatedAt: Date.now(),
    verificationCount: verifications.length,
    sessionCount: sessions.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildCloudVerificationInventoryReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map(
    (v) => `${v.verificationId} — ${v.verificationMetadata.verificationName} (${v.verificationType}) state=${v.verificationState}`,
  );
  return buildReport(
    'CLOUD_VERIFICATION_INVENTORY_REPORT',
    `Cloud verification inventory — ${verifications.length} requests (authority only)`,
    findings.length > 0 ? findings : ['No cloud verifications registered yet'],
  );
}

export function buildCloudVerificationOwnershipReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map(
    (v) =>
      `${v.verificationId}: owner=${v.verificationOwner.ownerModule} project=${v.verificationOwner.projectId} runtime=${v.verificationOwner.runtimeId} workspace=${v.verificationOwner.workspaceId} build=${v.verificationOwner.persistentBuildId}`,
  );
  return buildReport(
    'CLOUD_VERIFICATION_OWNERSHIP_REPORT',
    `Cloud verification ownership — ${verifications.length} records`,
    findings.length > 0 ? findings : ['No ownership records'],
  );
}

export function buildCloudVerificationLifecycleReport(): CloudVerificationReport {
  const events = listStoredCloudVerificationLifecycleEvents();
  const findings = events.map((e) => `${e.verificationId}: ${e.eventType} (${e.previousState} → ${e.newState})`);
  return buildReport(
    'CLOUD_VERIFICATION_LIFECYCLE_REPORT',
    `Cloud verification lifecycle — ${events.length} events`,
    findings.length > 0 ? findings : ['No lifecycle events'],
  );
}

export function buildCloudVerificationStateReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map((v) => {
    const history = getStoredCloudVerificationStateHistory(v.verificationId);
    return `${v.verificationId}: state=${v.verificationState} transitions=${history.length}`;
  });
  return buildReport(
    'CLOUD_VERIFICATION_STATE_REPORT',
    `Cloud verification state — ${verifications.length} tracked`,
    findings.length > 0 ? findings : ['No state records'],
  );
}

export function buildCloudVerificationScopeReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map(
    (v) =>
      `${v.verificationId}: scope=${v.verificationScope.scopeType} depth=${v.verificationScope.verificationDepth} intent=${v.verificationScope.verificationIntent}`,
  );
  return buildReport(
    'CLOUD_VERIFICATION_SCOPE_REPORT',
    `Cloud verification scope — ${verifications.length} records`,
    findings.length > 0 ? findings : ['No scope records'],
  );
}

export function buildCloudVerificationContextReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map((v) => `${v.verificationId}: ${v.verificationContext.contextSummary}`);
  return buildReport(
    'CLOUD_VERIFICATION_CONTEXT_REPORT',
    `Cloud verification context — ${verifications.length} records`,
    findings.length > 0 ? findings : ['No context records'],
  );
}

export function buildCloudVerificationEvidenceLinkReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map(
    (v) =>
      `${v.verificationId}: evidence=[${v.verificationEvidenceLink.evidenceIds.join(', ')}] mismatch=${detectEvidenceMismatch(v.verificationId)}`,
  );
  return buildReport(
    'CLOUD_VERIFICATION_EVIDENCE_LINK_REPORT',
    `Evidence links — ${verifications.length} verifications`,
    findings.length > 0 ? findings : ['No evidence links'],
  );
}

export function buildCloudVerificationReportLinkReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map(
    (v) =>
      `${v.verificationId}: reports=[${v.verificationReportLink.reportIds.join(', ')}] mismatch=${detectReportMismatch(v.verificationId)}`,
  );
  return buildReport(
    'CLOUD_VERIFICATION_REPORT_LINK_REPORT',
    `Report links — ${verifications.length} verifications`,
    findings.length > 0 ? findings : ['No report links'],
  );
}

export function buildCloudVerificationRuntimeLinkReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map(
    (v) =>
      `${v.verificationId}: runtime=${v.verificationRuntimeLink.runtimeId} mismatch=${detectCloudVerificationRuntimeMismatch(v.verificationId)}`,
  );
  return buildReport(
    'CLOUD_VERIFICATION_RUNTIME_LINK_REPORT',
    `Runtime links — ${verifications.length} verifications`,
    findings.length > 0 ? findings : ['No runtime links'],
  );
}

export function buildCloudVerificationWorkspaceLinkReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map(
    (v) =>
      `${v.verificationId}: workspace=${v.verificationWorkspaceLink.workspaceId} mismatch=${detectCloudVerificationWorkspaceMismatch(v.verificationId)}`,
  );
  return buildReport(
    'CLOUD_VERIFICATION_WORKSPACE_LINK_REPORT',
    `Workspace links — ${verifications.length} verifications`,
    findings.length > 0 ? findings : ['No workspace links'],
  );
}

export function buildCloudVerificationPersistentBuildLinkReport(): CloudVerificationReport {
  const verifications = listStoredCloudVerifications();
  const findings = verifications.map(
    (v) =>
      `${v.verificationId}: build=${v.verificationPersistentBuildLink.persistentBuildId} mismatch=${detectCloudVerificationBuildMismatch(v.verificationId)}`,
  );
  return buildReport(
    'CLOUD_VERIFICATION_PERSISTENT_BUILD_LINK_REPORT',
    `Persistent build links — ${verifications.length} verifications`,
    findings.length > 0 ? findings : ['No build links'],
  );
}

export function buildCloudVerificationHistoryReport(): CloudVerificationReport {
  const history = getCloudVerificationHistory();
  const findings = history.slice(-20).map((e) => `${e.verificationId} [${e.category}]: ${e.summary}`);
  return buildReport(
    'CLOUD_VERIFICATION_HISTORY_REPORT',
    `Cloud verification history — ${history.length} entries`,
    findings.length > 0 ? findings : ['No history entries'],
  );
}

export function buildCloudVerificationDiagnosticsReport(): CloudVerificationReport {
  const diag = getCloudVerificationDiagnostics();
  const findings = [
    `Authority active: ${diag.cloudVerificationAuthorityActive}`,
    `Registered: ${diag.registeredVerificationCount}`,
    `Sessions: ${diag.activeSessionCount}`,
    `Ready: ${diag.readyVerificationCount}`,
    `Waiting: ${diag.waitingVerificationCount}`,
    `Blocked: ${diag.blockedVerificationCount}`,
    `Duplicate risks: ${diag.duplicateRiskCount}`,
    `Runtime mismatches: ${diag.runtimeMismatchCount}`,
    `Workspace mismatches: ${diag.workspaceMismatchCount}`,
    `Build mismatches: ${diag.buildMismatchCount}`,
    `Evidence mismatches: ${diag.evidenceMismatchCount}`,
    `Report mismatches: ${diag.reportMismatchCount}`,
    `Unified entry mismatches: ${diag.unifiedEntryMismatchCount}`,
  ];
  return buildReport(
    'CLOUD_VERIFICATION_DIAGNOSTICS_REPORT',
    'Cloud verification diagnostics — authority validation only',
    findings,
  );
}

export function buildAllCloudVerificationReports(): CloudVerificationReport[] {
  return [
    buildCloudVerificationInventoryReport(),
    buildCloudVerificationOwnershipReport(),
    buildCloudVerificationLifecycleReport(),
    buildCloudVerificationStateReport(),
    buildCloudVerificationScopeReport(),
    buildCloudVerificationContextReport(),
    buildCloudVerificationEvidenceLinkReport(),
    buildCloudVerificationReportLinkReport(),
    buildCloudVerificationRuntimeLinkReport(),
    buildCloudVerificationWorkspaceLinkReport(),
    buildCloudVerificationPersistentBuildLinkReport(),
    buildCloudVerificationHistoryReport(),
    buildCloudVerificationDiagnosticsReport(),
  ];
}

export function composeCloudVerificationResponse(
  query: string,
  verification: import('./cloud-verification-types.js').CloudVerification | null,
  session: import('./cloud-verification-types.js').CloudVerificationSession | null,
  reports: CloudVerificationReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Cloud Verification Foundation: BLOCKED' : 'Cloud Verification Foundation: READY');
  lines.push('');
  lines.push(`Query: ${query}`);
  if (verification) {
    lines.push(`Verification: ${verification.verificationId} — ${verification.verificationMetadata.verificationName}`);
    lines.push(`State: ${verification.verificationState}`);
    lines.push(`Unified Entry: ${verification.verificationUnifiedEntryLink.unifiedSessionId || 'not linked'}`);
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
  lines.push('Authority only — no verification provider execution, cloud workers, or file mutation.');
  lines.push('Unified Verification Entry remains global verification source of truth.');
  return lines.join('\n');
}

export function buildCloudVerificationFailureContext(query: string): Array<{
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}> {
  if (!isCloudVerificationFoundationQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: Array<{
    title: string;
    description: string;
    sourceSystem: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> = [
    {
      title: 'Cloud verification foundation: authority only',
      description: 'Phase 17.4 cloud-specific verification coordination without provider execution',
      sourceSystem: 'cloud_verification_foundation',
      severity: 'LOW',
    },
  ];

  if (lower.includes('blocked') || lower.includes('failed')) {
    records.push({
      title: 'Cloud verification blocked',
      description: 'Cloud verification foundation gates failed — inspect ownership, bridges, and unified entry link',
      sourceSystem: 'cloud_verification_foundation',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('duplicate') || lower.includes('mismatch')) {
    records.push({
      title: 'Cloud verification risk detected',
      description: 'Duplicate or mismatched cloud verification authority — do not create parallel systems',
      sourceSystem: 'cloud_verification_foundation',
      severity: 'HIGH',
    });
  }

  return records;
}
