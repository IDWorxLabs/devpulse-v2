/**
 * Mobile Command Runtime Foundation — report builder.
 */

import {
  listStoredMobileCommandSessions,
  listStoredMobileCommandTrackedSessions,
  listStoredMobileCommandLifecycleEvents,
} from './mobile-command-store.js';
import { getMobileCommandHistory } from './mobile-command-history.js';
import { getMobileCommandDiagnostics, runMobileCommandDiagnosticsScan } from './mobile-command-diagnostics.js';
import { detectMobileCommandCloudMismatch } from './mobile-command-cloud-bridge.js';
import { detectMobileCommandWorkspaceMismatch } from './mobile-command-workspace-bridge.js';
import { detectMobileCommandBuildMismatch } from './mobile-command-build-bridge.js';
import { detectMobileCommandVerificationMismatch } from './mobile-command-verification-bridge.js';
import { detectMobileCommandRecoveryMismatch } from './mobile-command-recovery-bridge.js';
import { detectMobileCommandMonitoringMismatch } from './mobile-command-monitoring-bridge.js';
import { detectMobileCommandOperatorFeedMismatch } from './mobile-command-operator-feed-bridge.js';
import { detectMobileCommandProjectVaultMismatch } from './mobile-command-project-vault-bridge.js';
import { isMobileCommandRuntimeFoundationQuestion } from './mobile-command-types.js';
import type { MobileCommandReport, MobileCommandReportType } from './mobile-command-types.js';

let reportCounter = 0;

export function resetMobileCommandReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextMobileCommandReportId(): string {
  reportCounter += 1;
  return `mcrpt-${reportCounter.toString().padStart(4, '0')}`;
}

function buildReport(
  reportType: MobileCommandReportType,
  summary: string,
  findings: string[],
): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const tracked = listStoredMobileCommandTrackedSessions();
  return {
    reportId: nextMobileCommandReportId(),
    reportType,
    generatedAt: Date.now(),
    mobileCommandCount: sessions.length,
    sessionCount: tracked.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildMobileCommandInventoryReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) => `${s.mobileCommandId} — ${s.mobileCommandMetadata.commandName} (${s.mobileCommandType}) state=${s.mobileCommandState}`,
  );
  return buildReport(
    'MOBILE_COMMAND_INVENTORY_REPORT',
    `Mobile command inventory — ${sessions.length} sessions (authority only)`,
    findings.length > 0 ? findings : ['No mobile command sessions registered yet'],
  );
}

export function buildMobileCommandOwnershipReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: owner=${s.mobileCommandOwner.ownerModule} project=${s.mobileCommandOwner.projectId} session=${s.mobileCommandOwner.mobileCommandSessionId ?? 'none'}`,
  );
  return buildReport(
    'MOBILE_COMMAND_OWNERSHIP_REPORT',
    `Mobile command ownership — ${sessions.length} records`,
    findings.length > 0 ? findings : ['No ownership records'],
  );
}

export function buildMobileCommandLifecycleReport(): MobileCommandReport {
  const events = listStoredMobileCommandLifecycleEvents();
  const findings = events.map((e) => `${e.mobileCommandId}: ${e.eventType} (${e.previousState} → ${e.newState})`);
  return buildReport(
    'MOBILE_COMMAND_LIFECYCLE_REPORT',
    `Mobile command lifecycle — ${events.length} events`,
    findings.length > 0 ? findings : ['No lifecycle events'],
  );
}

export function buildMobileCommandStateReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map((s) => `${s.mobileCommandId}: state=${s.mobileCommandState} status=${s.mobileCommandStatus}`);
  return buildReport(
    'MOBILE_COMMAND_STATE_REPORT',
    `Mobile command state — ${sessions.length} records`,
    findings.length > 0 ? findings : ['No state records'],
  );
}

export function buildMobileCommandContextReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map((s) => `${s.mobileCommandId}: ${s.mobileCommandContext.contextSummary}`);
  return buildReport(
    'MOBILE_COMMAND_CONTEXT_REPORT',
    `Mobile command context — ${sessions.length} records`,
    findings.length > 0 ? findings : ['No context records'],
  );
}

export function buildMobileCommandPermissionsReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: allowed=${s.mobileCommandPermissions.allowedMobileActions.length} blocked=${s.mobileCommandPermissions.blockedMobileActions.length} preview=${s.mobileCommandPermissions.mobilePreviewAllowed}`,
  );
  return buildReport(
    'MOBILE_COMMAND_PERMISSIONS_REPORT',
    `Mobile command permissions — ${sessions.length} records`,
    findings.length > 0 ? findings : ['No permission records'],
  );
}

export function buildMobileCommandActionGateReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.flatMap((s) =>
    s.mobileCommandActionGateResults.map(
      (g) => `${s.mobileCommandId}: ${g.actionName} → ${g.result} (${g.reason})`,
    ),
  );
  return buildReport(
    'MOBILE_COMMAND_ACTION_GATE_REPORT',
    `Mobile command action gate — ${findings.length} results`,
    findings.length > 0 ? findings : ['No action gate results'],
  );
}

export function buildMobileCommandCloudLinkReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: runtime=${s.mobileCommandCloudLink.runtimeId} mismatch=${detectMobileCommandCloudMismatch(s.mobileCommandId)}`,
  );
  return buildReport(
    'MOBILE_COMMAND_CLOUD_LINK_REPORT',
    `Cloud runtime links — ${sessions.length} mobile commands`,
    findings.length > 0 ? findings : ['No cloud links'],
  );
}

export function buildMobileCommandWorkspaceLinkReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: workspace=${s.mobileCommandWorkspaceLink.workspaceId} mismatch=${detectMobileCommandWorkspaceMismatch(s.mobileCommandId)}`,
  );
  return buildReport(
    'MOBILE_COMMAND_WORKSPACE_LINK_REPORT',
    `Workspace links — ${sessions.length} mobile commands`,
    findings.length > 0 ? findings : ['No workspace links'],
  );
}

export function buildMobileCommandBuildLinkReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: build=${s.mobileCommandBuildLink.persistentBuildId} mismatch=${detectMobileCommandBuildMismatch(s.mobileCommandId)}`,
  );
  return buildReport(
    'MOBILE_COMMAND_BUILD_LINK_REPORT',
    `Persistent build links — ${sessions.length} mobile commands`,
    findings.length > 0 ? findings : ['No build links'],
  );
}

export function buildMobileCommandVerificationLinkReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: verification=${s.mobileCommandVerificationLink.verificationId} mismatch=${detectMobileCommandVerificationMismatch(s.mobileCommandId)}`,
  );
  return buildReport(
    'MOBILE_COMMAND_VERIFICATION_LINK_REPORT',
    `Verification links — ${sessions.length} mobile commands`,
    findings.length > 0 ? findings : ['No verification links'],
  );
}

export function buildMobileCommandRecoveryLinkReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: recovery=${s.mobileCommandRecoveryLink.recoveryId} mismatch=${detectMobileCommandRecoveryMismatch(s.mobileCommandId)}`,
  );
  return buildReport(
    'MOBILE_COMMAND_RECOVERY_LINK_REPORT',
    `Recovery links — ${sessions.length} mobile commands`,
    findings.length > 0 ? findings : ['No recovery links'],
  );
}

export function buildMobileCommandMonitoringLinkReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: monitoring=${s.mobileCommandMonitoringLink.monitoringId} mismatch=${detectMobileCommandMonitoringMismatch(s.mobileCommandId)}`,
  );
  return buildReport(
    'MOBILE_COMMAND_MONITORING_LINK_REPORT',
    `Monitoring links — ${sessions.length} mobile commands`,
    findings.length > 0 ? findings : ['No monitoring links'],
  );
}

export function buildMobileCommandOperatorFeedReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: feed=${s.mobileCommandOperatorFeedLink.feedAuthorityId} mismatch=${detectMobileCommandOperatorFeedMismatch(s.mobileCommandId)}`,
  );
  return buildReport(
    'MOBILE_COMMAND_OPERATOR_FEED_REPORT',
    `Operator feed links — ${sessions.length} mobile commands`,
    findings.length > 0 ? findings : ['No operator feed links'],
  );
}

export function buildMobileCommandProjectVaultReport(): MobileCommandReport {
  const sessions = listStoredMobileCommandSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileCommandId}: vault=${s.mobileCommandProjectVaultLink.vaultProjectId} mismatch=${detectMobileCommandProjectVaultMismatch(s.mobileCommandId)}`,
  );
  return buildReport(
    'MOBILE_COMMAND_PROJECT_VAULT_REPORT',
    `Project vault links — ${sessions.length} mobile commands`,
    findings.length > 0 ? findings : ['No project vault links'],
  );
}

export function buildMobileCommandHistoryReport(): MobileCommandReport {
  const history = getMobileCommandHistory();
  const findings = history.slice(-20).map((e) => `${e.mobileCommandId} [${e.category}]: ${e.summary}`);
  return buildReport(
    'MOBILE_COMMAND_HISTORY_REPORT',
    `Mobile command history — ${history.length} entries`,
    findings.length > 0 ? findings : ['No history entries'],
  );
}

export function buildMobileCommandDiagnosticsReport(): MobileCommandReport {
  const diag = getMobileCommandDiagnostics();
  const scan = runMobileCommandDiagnosticsScan();
  const findings = [
    `Authority active: ${diag.mobileCommandAuthorityActive}`,
    `Registered: ${diag.registeredMobileCommandCount}`,
    `Tracked sessions: ${diag.activeSessionCount}`,
    `Connected: ${diag.connectedMobileCommandCount}`,
    `Action allowed: ${diag.actionAllowedCount}`,
    `Action blocked: ${diag.actionBlockedCount}`,
    `Waiting approval: ${diag.waitingApprovalCount}`,
    `Duplicate risks: ${diag.duplicateRiskCount}`,
    ...scan.slice(0, 10),
  ];
  return buildReport(
    'MOBILE_COMMAND_DIAGNOSTICS_REPORT',
    'Mobile command diagnostics — authority validation only',
    findings,
  );
}

export function buildAllMobileCommandReports(): MobileCommandReport[] {
  return [
    buildMobileCommandInventoryReport(),
    buildMobileCommandOwnershipReport(),
    buildMobileCommandLifecycleReport(),
    buildMobileCommandStateReport(),
    buildMobileCommandContextReport(),
    buildMobileCommandPermissionsReport(),
    buildMobileCommandActionGateReport(),
    buildMobileCommandCloudLinkReport(),
    buildMobileCommandWorkspaceLinkReport(),
    buildMobileCommandBuildLinkReport(),
    buildMobileCommandVerificationLinkReport(),
    buildMobileCommandRecoveryLinkReport(),
    buildMobileCommandMonitoringLinkReport(),
    buildMobileCommandOperatorFeedReport(),
    buildMobileCommandProjectVaultReport(),
    buildMobileCommandHistoryReport(),
    buildMobileCommandDiagnosticsReport(),
  ];
}

export function composeMobileCommandResponse(
  query: string,
  session: import('./mobile-command-types.js').MobileCommandSession | null,
  trackedSession: import('./mobile-command-types.js').MobileCommandTrackedSession | null,
  reports: MobileCommandReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Mobile Command Runtime Foundation: BLOCKED' : 'Mobile Command Runtime Foundation: READY');
  lines.push('');
  lines.push(`Query: ${query}`);
  if (session) {
    lines.push(`Mobile Command: ${session.mobileCommandId} — ${session.mobileCommandMetadata.commandName}`);
    lines.push(`State: ${session.mobileCommandState}`);
    lines.push(`Type: ${session.mobileCommandType}`);
    lines.push(`Action gates: ${session.mobileCommandActionGateResults.length}`);
  }
  if (trackedSession) {
    lines.push(`Tracked Session: ${trackedSession.sessionId} — ${trackedSession.sessionState}`);
  }
  lines.push('');
  lines.push('Reports:');
  for (const r of reports) {
    lines.push(`  ${r.reportType}: ${r.summary}`);
  }
  lines.push('');
  lines.push('Authority only — no mobile UI, push notifications, or cloud execution.');
  return lines.join('\n');
}

export function buildMobileCommandFailureContext(query: string): Array<{
  title: string;
  description: string;
  sourceSystem: string;
}> {
  if (!isMobileCommandRuntimeFoundationQuestion(query)) return [];
  return [
    {
      title: 'Mobile command session blocked',
      description: 'Mobile Command Runtime Foundation rejected session registration due to missing upstream links, duplicate authority risk, or invalid permission metadata.',
      sourceSystem: 'mobile_command_runtime_foundation',
    },
    {
      title: 'Mobile action gate blocked',
      description: 'Requested mobile action is blocked by permission metadata — desktop-only or founder-only actions require non-mobile surfaces.',
      sourceSystem: 'mobile_command_runtime_foundation',
    },
    {
      title: 'Mobile command upstream mismatch',
      description: 'Mobile command links reference runtime, workspace, build, verification, recovery, or monitoring records that do not align with project ownership.',
      sourceSystem: 'mobile_command_runtime_foundation',
    },
    {
      title: 'Parallel mobile command authority risk',
      description: 'Duplicate mobile command authority detected — integrate with Mobile Command Runtime Foundation instead of creating parallel session state.',
      sourceSystem: 'mobile_command_runtime_foundation',
    },
  ];
}
