/**
 * Cross Device Runtime Foundation — report builder.
 */

import {
  listStoredCrossDeviceSessions,
  listStoredCrossDeviceTrackedSessions,
  listStoredCrossDeviceLifecycleEvents,
  listStoredDeviceRecords,
  listStoredDeviceLinks,
  listStoredDeviceHandoffs,
  nextCrossDeviceReportId,
  resetCrossDeviceReportCounterForTests as resetStoreReportCounterForTests,
} from './cross-device-store.js';
import { getCrossDeviceHistory } from './cross-device-history.js';
import { getCrossDeviceDiagnostics, runCrossDeviceDiagnosticsScan } from './cross-device-diagnostics.js';
import { detectCrossDeviceCommandMismatch } from './cross-device-command-bridge.js';
import { detectCrossDeviceChatMismatch } from './cross-device-chat-bridge.js';
import { detectCrossDevicePreviewMismatch } from './cross-device-preview-bridge.js';
import { detectCrossDeviceApprovalMismatch } from './cross-device-approval-bridge.js';
import { detectCrossDeviceCloudMismatch } from './cross-device-cloud-bridge.js';
import { isCrossDeviceRuntimeFoundationQuestion } from './cross-device-types.js';
import type { CrossDeviceReport, CrossDeviceReportType } from './cross-device-types.js';

export function resetCrossDeviceReportCounterForTests(): void {
  resetStoreReportCounterForTests();
}

function buildReport(reportType: CrossDeviceReportType, summary: string, findings: string[]): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const tracked = listStoredCrossDeviceTrackedSessions();
  const records = listStoredDeviceRecords();
  const links = listStoredDeviceLinks();
  const handoffs = listStoredDeviceHandoffs();
  return {
    reportId: nextCrossDeviceReportId(),
    reportType,
    generatedAt: Date.now(),
    crossDeviceCount: sessions.length,
    deviceRecordCount: records.length,
    deviceLinkCount: links.length,
    deviceHandoffCount: handoffs.length,
    sessionCount: tracked.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildCrossDeviceInventoryReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId} — ${s.crossDeviceMetadata.crossDeviceName} (${s.crossDeviceType}) state=${s.crossDeviceState}`,
  );
  return buildReport(
    'CROSS_DEVICE_INVENTORY_REPORT',
    `Cross device inventory — ${sessions.length} sessions`,
    findings.length ? findings : ['No sessions'],
  );
}

export function buildCrossDeviceOwnershipReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: device=${s.crossDeviceOwner.deviceId} command=${s.crossDeviceOwner.mobileCommandSessionId} approval=${s.crossDeviceOwner.mobileApprovalSessionId}`,
  );
  return buildReport(
    'CROSS_DEVICE_OWNERSHIP_REPORT',
    `Ownership — ${sessions.length} records`,
    findings.length ? findings : ['No ownership records'],
  );
}

export function buildCrossDeviceLifecycleReport(): CrossDeviceReport {
  const events = listStoredCrossDeviceLifecycleEvents();
  const findings = events.map((e) => `${e.crossDeviceId}: ${e.eventType}`);
  return buildReport(
    'CROSS_DEVICE_LIFECYCLE_REPORT',
    `Lifecycle — ${events.length} events`,
    findings.length ? findings : ['No events'],
  );
}

export function buildCrossDeviceStateReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map((s) => `${s.crossDeviceId}: ${s.crossDeviceState}`);
  return buildReport(
    'CROSS_DEVICE_STATE_REPORT',
    `State — ${sessions.length} records`,
    findings.length ? findings : ['No state records'],
  );
}

export function buildCrossDeviceContextReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map((s) => `${s.crossDeviceId}: ${s.crossDeviceContext.contextSummary}`);
  return buildReport(
    'CROSS_DEVICE_CONTEXT_REPORT',
    `Context — ${sessions.length} records`,
    findings.length ? findings : ['No context'],
  );
}

export function buildDeviceRegistrationReport(): CrossDeviceReport {
  const records = listStoredDeviceRecords();
  const findings = records.map((r) => `${r.deviceRecordId}: ${r.deviceId} (${r.deviceType})`);
  return buildReport(
    'DEVICE_REGISTRATION_REPORT',
    `Device registrations — ${records.length} records`,
    findings.length ? findings : ['No device records'],
  );
}

export function buildDeviceLinkReport(): CrossDeviceReport {
  const links = listStoredDeviceLinks();
  const findings = links.map((l) => `${l.deviceLinkId}: ${l.sourceDeviceId} → ${l.targetDeviceId} (${l.linkStatus})`);
  return buildReport(
    'DEVICE_LINK_REPORT',
    `Device links — ${links.length} records`,
    findings.length ? findings : ['No device links'],
  );
}

export function buildDeviceHandoffReport(): CrossDeviceReport {
  const handoffs = listStoredDeviceHandoffs();
  const findings = handoffs.map((h) => `${h.handoffId}: ${h.handoffStatus} — ${h.handoffReason.slice(0, 60)}`);
  return buildReport(
    'DEVICE_HANDOFF_REPORT',
    `Device handoffs — ${handoffs.length} records`,
    findings.length ? findings : ['No device handoffs'],
  );
}

export function buildDeviceVisibilityReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: mobile=${s.crossDeviceVisibility.visibleOnMobile} desktop=${s.crossDeviceVisibility.visibleOnDesktop} cloud=${s.crossDeviceVisibility.visibleOnCloud}`,
  );
  return buildReport(
    'DEVICE_VISIBILITY_REPORT',
    `Device visibility — ${sessions.length} records`,
    findings.length ? findings : ['No visibility records'],
  );
}

export function buildCrossDeviceCommandLinkReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: command=${s.crossDeviceCommandLink.mobileCommandId} mismatch=${detectCrossDeviceCommandMismatch(s.crossDeviceId)}`,
  );
  return buildReport(
    'CROSS_DEVICE_COMMAND_LINK_REPORT',
    `Command links — ${sessions.length}`,
    findings.length ? findings : ['No command links'],
  );
}

export function buildCrossDeviceChatLinkReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: chat=${s.crossDeviceChatLink.mobileChatId} mismatch=${detectCrossDeviceChatMismatch(s.crossDeviceId)}`,
  );
  return buildReport(
    'CROSS_DEVICE_CHAT_LINK_REPORT',
    `Chat links — ${sessions.length}`,
    findings.length ? findings : ['No chat links'],
  );
}

export function buildCrossDevicePreviewLinkReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: preview=${s.crossDevicePreviewLink.mobilePreviewId} mismatch=${detectCrossDevicePreviewMismatch(s.crossDeviceId)}`,
  );
  return buildReport(
    'CROSS_DEVICE_PREVIEW_LINK_REPORT',
    `Preview links — ${sessions.length}`,
    findings.length ? findings : ['No preview links'],
  );
}

export function buildCrossDeviceApprovalLinkReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: approval=${s.crossDeviceApprovalLink.mobileApprovalId} mismatch=${detectCrossDeviceApprovalMismatch(s.crossDeviceId)}`,
  );
  return buildReport(
    'CROSS_DEVICE_APPROVAL_LINK_REPORT',
    `Approval links — ${sessions.length}`,
    findings.length ? findings : ['No approval links'],
  );
}

export function buildCrossDeviceCloudLinkReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: runtime=${s.crossDeviceCloudLink.runtimeId} mismatch=${detectCrossDeviceCloudMismatch(s.crossDeviceId)}`,
  );
  return buildReport(
    'CROSS_DEVICE_CLOUD_LINK_REPORT',
    `Cloud links — ${sessions.length}`,
    findings.length ? findings : ['No cloud links'],
  );
}

export function buildCrossDeviceWorkspaceLinkReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: workspace=${s.crossDeviceWorkspaceLink.workspaceId} mismatch=${s.crossDeviceWorkspaceLink.mismatchDetected}`,
  );
  return buildReport(
    'CROSS_DEVICE_WORKSPACE_LINK_REPORT',
    `Workspace links — ${sessions.length}`,
    findings.length ? findings : ['No workspace links'],
  );
}

export function buildCrossDeviceBuildLinkReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: build=${s.crossDeviceBuildLink.persistentBuildId} mismatch=${s.crossDeviceBuildLink.mismatchDetected}`,
  );
  return buildReport(
    'CROSS_DEVICE_BUILD_LINK_REPORT',
    `Build links — ${sessions.length}`,
    findings.length ? findings : ['No build links'],
  );
}

export function buildCrossDeviceOperatorFeedReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: feed=${s.crossDeviceOperatorFeedLink.feedAuthorityId} mismatch=${s.crossDeviceOperatorFeedLink.mismatchDetected}`,
  );
  return buildReport(
    'CROSS_DEVICE_OPERATOR_FEED_REPORT',
    `Operator feed links — ${sessions.length}`,
    findings.length ? findings : ['No operator feed links'],
  );
}

export function buildCrossDeviceProjectVaultReport(): CrossDeviceReport {
  const sessions = listStoredCrossDeviceSessions();
  const findings = sessions.map(
    (s) =>
      `${s.crossDeviceId}: vault=${s.crossDeviceProjectVaultLink.vaultProjectId} mismatch=${s.crossDeviceProjectVaultLink.mismatchDetected}`,
  );
  return buildReport(
    'CROSS_DEVICE_PROJECT_VAULT_REPORT',
    `Project vault links — ${sessions.length}`,
    findings.length ? findings : ['No project vault links'],
  );
}

export function buildCrossDeviceHistoryReport(): CrossDeviceReport {
  const history = getCrossDeviceHistory();
  const findings = history.slice(-20).map((e) => `${e.crossDeviceId} [${e.category}]: ${e.summary}`);
  return buildReport(
    'CROSS_DEVICE_HISTORY_REPORT',
    `History — ${history.length} entries`,
    findings.length ? findings : ['No history'],
  );
}

export function buildCrossDeviceDiagnosticsReport(): CrossDeviceReport {
  const diag = getCrossDeviceDiagnostics();
  const scan = runCrossDeviceDiagnosticsScan();
  const findings = [
    `Authority active: ${diag.crossDeviceAuthorityActive}`,
    `Registered cross devices: ${diag.registeredCrossDeviceCount}`,
    `Device records: ${diag.registeredDeviceRecordCount}`,
    `Command mismatches: ${diag.commandMismatchCount}`,
    `Approval mismatches: ${diag.approvalMismatchCount}`,
    ...scan.slice(0, 10),
  ];
  return buildReport(
    'CROSS_DEVICE_DIAGNOSTICS_REPORT',
    'Diagnostics — authority validation only',
    findings,
  );
}

export function buildAllCrossDeviceReports(): CrossDeviceReport[] {
  return [
    buildCrossDeviceInventoryReport(),
    buildCrossDeviceOwnershipReport(),
    buildCrossDeviceLifecycleReport(),
    buildCrossDeviceStateReport(),
    buildCrossDeviceContextReport(),
    buildDeviceRegistrationReport(),
    buildDeviceLinkReport(),
    buildDeviceHandoffReport(),
    buildDeviceVisibilityReport(),
    buildCrossDeviceCommandLinkReport(),
    buildCrossDeviceChatLinkReport(),
    buildCrossDevicePreviewLinkReport(),
    buildCrossDeviceApprovalLinkReport(),
    buildCrossDeviceCloudLinkReport(),
    buildCrossDeviceWorkspaceLinkReport(),
    buildCrossDeviceBuildLinkReport(),
    buildCrossDeviceOperatorFeedReport(),
    buildCrossDeviceProjectVaultReport(),
    buildCrossDeviceHistoryReport(),
    buildCrossDeviceDiagnosticsReport(),
  ];
}

export function composeCrossDeviceResponse(
  query: string,
  session: import('./cross-device-types.js').CrossDeviceSession | null,
  trackedSession: import('./cross-device-types.js').CrossDeviceTrackedSession | null,
  reports: CrossDeviceReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Cross Device Runtime Foundation: BLOCKED' : 'Cross Device Runtime Foundation: READY');
  lines.push(`Query: ${query}`);
  if (session) {
    lines.push(`Cross Device: ${session.crossDeviceId} — ${session.crossDeviceMetadata.crossDeviceName}`);
    lines.push(`State: ${session.crossDeviceState}`);
    lines.push(`Devices: ${session.deviceRecords.length} Links: ${session.deviceLinks.length} Handoffs: ${session.deviceHandoffs.length}`);
  }
  if (trackedSession) lines.push(`Session: ${trackedSession.sessionId}`);
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Authority only — no real sync, connections, or device pairing.');
  return lines.join('\n');
}

export function buildCrossDeviceFailureContext(
  query: string,
): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isCrossDeviceRuntimeFoundationQuestion(query)) return [];
  return [
    {
      title: 'Cross device session blocked',
      description: 'Registration rejected due to missing upstream links or duplicate cross device authority risk.',
      sourceSystem: 'cross_device_runtime_foundation',
    },
    {
      title: 'Device link blocked',
      description: 'Device link metadata blocked — inspect command, chat, preview, and approval upstream authorities.',
      sourceSystem: 'cross_device_runtime_foundation',
    },
    {
      title: 'Handoff metadata deferred',
      description: 'Handoff could not be finalized — additional context or founder review required.',
      sourceSystem: 'cross_device_runtime_foundation',
    },
    {
      title: 'Parallel cross device authority risk',
      description: 'Duplicate cross device authority detected — use Cross Device Runtime Foundation.',
      sourceSystem: 'cross_device_runtime_foundation',
    },
  ];
}
