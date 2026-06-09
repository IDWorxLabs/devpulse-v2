/**
 * Mobile Approval Runtime Foundation — report builder.
 */

import {
  listStoredMobileApprovalSessions,
  listStoredMobileApprovalTrackedSessions,
  listStoredMobileApprovalLifecycleEvents,
  listStoredMobileApprovalRequests,
  listStoredMobileApprovalDecisions,
  nextMobileApprovalReportId,
} from './mobile-approval-store.js';
import { getMobileApprovalHistory } from './mobile-approval-history.js';
import { getMobileApprovalDiagnostics, runMobileApprovalDiagnosticsScan } from './mobile-approval-diagnostics.js';
import { detectMobileApprovalCommandMismatch } from './mobile-approval-command-bridge.js';
import { detectMobileApprovalChatMismatch } from './mobile-approval-chat-bridge.js';
import { detectMobileApprovalPreviewMismatch } from './mobile-approval-preview-bridge.js';
import { detectMobileApprovalCloudMismatch } from './mobile-approval-cloud-bridge.js';
import { isMobileApprovalRuntimeFoundationQuestion } from './mobile-approval-types.js';
import type { MobileApprovalReport, MobileApprovalReportType } from './mobile-approval-types.js';
import { resetMobileApprovalReportCounterForTests as resetStoreReportCounterForTests } from './mobile-approval-store.js';

export function resetMobileApprovalReportCounterForTests(): void {
  resetStoreReportCounterForTests();
}

function buildReport(reportType: MobileApprovalReportType, summary: string, findings: string[]): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const tracked = listStoredMobileApprovalTrackedSessions();
  const requests = listStoredMobileApprovalRequests();
  const decisions = listStoredMobileApprovalDecisions();
  return {
    reportId: nextMobileApprovalReportId(),
    reportType,
    generatedAt: Date.now(),
    mobileApprovalCount: sessions.length,
    approvalRequestCount: requests.length,
    approvalDecisionCount: decisions.length,
    sessionCount: tracked.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildMobileApprovalInventoryReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId} — ${s.mobileApprovalMetadata.approvalName} (${s.mobileApprovalType}) state=${s.mobileApprovalState}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_INVENTORY_REPORT',
    `Mobile approval inventory — ${sessions.length} sessions`,
    findings.length ? findings : ['No sessions'],
  );
}

export function buildMobileApprovalOwnershipReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId}: command=${s.mobileApprovalOwner.mobileCommandSessionId} chat=${s.mobileApprovalOwner.mobileChatSessionId} preview=${s.mobileApprovalOwner.mobilePreviewSessionId} project=${s.mobileApprovalOwner.projectId}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_OWNERSHIP_REPORT',
    `Ownership — ${sessions.length} records`,
    findings.length ? findings : ['No ownership records'],
  );
}

export function buildMobileApprovalLifecycleReport(): MobileApprovalReport {
  const events = listStoredMobileApprovalLifecycleEvents();
  const findings = events.map((e) => `${e.mobileApprovalId}: ${e.eventType}`);
  return buildReport(
    'MOBILE_APPROVAL_LIFECYCLE_REPORT',
    `Lifecycle — ${events.length} events`,
    findings.length ? findings : ['No events'],
  );
}

export function buildMobileApprovalStateReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map((s) => `${s.mobileApprovalId}: ${s.mobileApprovalState}`);
  return buildReport(
    'MOBILE_APPROVAL_STATE_REPORT',
    `State — ${sessions.length} records`,
    findings.length ? findings : ['No state records'],
  );
}

export function buildMobileApprovalContextReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map((s) => `${s.mobileApprovalId}: ${s.mobileApprovalContext.contextSummary}`);
  return buildReport(
    'MOBILE_APPROVAL_CONTEXT_REPORT',
    `Context — ${sessions.length} records`,
    findings.length ? findings : ['No context'],
  );
}

export function buildMobileApprovalRequestReport(): MobileApprovalReport {
  const requests = listStoredMobileApprovalRequests();
  const findings = requests.map((r) => `${r.requestId}: ${r.requestTitle} — ${r.result}`);
  return buildReport(
    'MOBILE_APPROVAL_REQUEST_REPORT',
    `Approval requests — ${requests.length} records`,
    findings.length ? findings : ['No approval requests'],
  );
}

export function buildMobileApprovalDecisionReport(): MobileApprovalReport {
  const decisions = listStoredMobileApprovalDecisions();
  const findings = decisions.map((d) => `${d.decisionId}: ${d.decisionType} — ${d.reason.slice(0, 60)}`);
  return buildReport(
    'MOBILE_APPROVAL_DECISION_REPORT',
    `Approval decisions — ${decisions.length} records`,
    findings.length ? findings : ['No approval decisions'],
  );
}

export function buildMobileApprovalGovernanceReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map((s) => {
    const gov = s.mobileApprovalGovernance;
    return gov
      ? `${s.mobileApprovalId}: ${gov.result} — ${gov.reason}`
      : `${s.mobileApprovalId}: governance not evaluated`;
  });
  return buildReport(
    'MOBILE_APPROVAL_GOVERNANCE_REPORT',
    `Governance — ${sessions.length} records`,
    findings.length ? findings : ['No governance records'],
  );
}

export function buildMobileApprovalCommandLinkReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId}: command=${s.mobileApprovalCommandLink.mobileCommandId} mismatch=${detectMobileApprovalCommandMismatch(s.mobileApprovalId)}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_COMMAND_LINK_REPORT',
    `Command links — ${sessions.length}`,
    findings.length ? findings : ['No command links'],
  );
}

export function buildMobileApprovalChatLinkReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId}: chat=${s.mobileApprovalChatLink.mobileChatId} mismatch=${detectMobileApprovalChatMismatch(s.mobileApprovalId)}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_CHAT_LINK_REPORT',
    `Chat links — ${sessions.length}`,
    findings.length ? findings : ['No chat links'],
  );
}

export function buildMobileApprovalPreviewLinkReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId}: preview=${s.mobileApprovalPreviewLink.mobilePreviewId} mismatch=${detectMobileApprovalPreviewMismatch(s.mobileApprovalId)}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_PREVIEW_LINK_REPORT',
    `Preview links — ${sessions.length}`,
    findings.length ? findings : ['No preview links'],
  );
}

export function buildMobileApprovalCloudLinkReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId}: runtime=${s.mobileApprovalCloudLink.runtimeId} mismatch=${detectMobileApprovalCloudMismatch(s.mobileApprovalId)}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_CLOUD_LINK_REPORT',
    `Cloud links — ${sessions.length}`,
    findings.length ? findings : ['No cloud links'],
  );
}

export function buildMobileApprovalWorkspaceLinkReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId}: workspace=${s.mobileApprovalWorkspaceLink.workspaceId} mismatch=${s.mobileApprovalWorkspaceLink.mismatchDetected}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_WORKSPACE_LINK_REPORT',
    `Workspace links — ${sessions.length}`,
    findings.length ? findings : ['No workspace links'],
  );
}

export function buildMobileApprovalBuildLinkReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId}: build=${s.mobileApprovalBuildLink.persistentBuildId} mismatch=${s.mobileApprovalBuildLink.mismatchDetected}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_BUILD_LINK_REPORT',
    `Build links — ${sessions.length}`,
    findings.length ? findings : ['No build links'],
  );
}

export function buildMobileApprovalFlowLinkReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId}: flow=${s.mobileApprovalFlowLink.approvalFlowFoundationId} phase=${s.mobileApprovalFlowLink.governancePhase} mismatch=${s.mobileApprovalFlowLink.mismatchDetected}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_FLOW_LINK_REPORT',
    `Flow links — ${sessions.length}`,
    findings.length ? findings : ['No flow links'],
  );
}

export function buildMobileApprovalOperatorFeedReport(): MobileApprovalReport {
  const sessions = listStoredMobileApprovalSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobileApprovalId}: feed=${s.mobileApprovalOperatorFeedLink.feedAuthorityId} mismatch=${s.mobileApprovalOperatorFeedLink.mismatchDetected}`,
  );
  return buildReport(
    'MOBILE_APPROVAL_OPERATOR_FEED_REPORT',
    `Operator feed links — ${sessions.length}`,
    findings.length ? findings : ['No operator feed links'],
  );
}

export function buildMobileApprovalHistoryReport(): MobileApprovalReport {
  const history = getMobileApprovalHistory();
  const findings = history.slice(-20).map((e) => `${e.mobileApprovalId} [${e.category}]: ${e.summary}`);
  return buildReport(
    'MOBILE_APPROVAL_HISTORY_REPORT',
    `History — ${history.length} entries`,
    findings.length ? findings : ['No history'],
  );
}

export function buildMobileApprovalDiagnosticsReport(): MobileApprovalReport {
  const diag = getMobileApprovalDiagnostics();
  const scan = runMobileApprovalDiagnosticsScan();
  const findings = [
    `Authority active: ${diag.mobileApprovalAuthorityActive}`,
    `Registered approvals: ${diag.registeredMobileApprovalCount}`,
    `Approval requests: ${diag.registeredApprovalRequestCount}`,
    `Approval decisions: ${diag.registeredApprovalDecisionCount}`,
    `Command mismatches: ${diag.commandMismatchCount}`,
    `Chat mismatches: ${diag.chatMismatchCount}`,
    `Preview mismatches: ${diag.previewMismatchCount}`,
    `Runtime mismatches: ${diag.runtimeMismatchCount}`,
    ...scan.slice(0, 10),
  ];
  return buildReport(
    'MOBILE_APPROVAL_DIAGNOSTICS_REPORT',
    'Diagnostics — authority validation only',
    findings,
  );
}

export function buildAllMobileApprovalReports(): MobileApprovalReport[] {
  return [
    buildMobileApprovalInventoryReport(),
    buildMobileApprovalOwnershipReport(),
    buildMobileApprovalLifecycleReport(),
    buildMobileApprovalStateReport(),
    buildMobileApprovalContextReport(),
    buildMobileApprovalRequestReport(),
    buildMobileApprovalDecisionReport(),
    buildMobileApprovalGovernanceReport(),
    buildMobileApprovalCommandLinkReport(),
    buildMobileApprovalChatLinkReport(),
    buildMobileApprovalPreviewLinkReport(),
    buildMobileApprovalCloudLinkReport(),
    buildMobileApprovalWorkspaceLinkReport(),
    buildMobileApprovalBuildLinkReport(),
    buildMobileApprovalFlowLinkReport(),
    buildMobileApprovalOperatorFeedReport(),
    buildMobileApprovalHistoryReport(),
    buildMobileApprovalDiagnosticsReport(),
  ];
}

export function composeMobileApprovalResponse(
  query: string,
  session: import('./mobile-approval-types.js').MobileApprovalSession | null,
  trackedSession: import('./mobile-approval-types.js').MobileApprovalTrackedSession | null,
  reports: MobileApprovalReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Mobile Approval Runtime Foundation: BLOCKED' : 'Mobile Approval Runtime Foundation: READY');
  lines.push(`Query: ${query}`);
  if (session) {
    lines.push(`Approval: ${session.mobileApprovalId} — ${session.mobileApprovalMetadata.approvalName}`);
    lines.push(`State: ${session.mobileApprovalState}`);
    lines.push(`Requests: ${session.mobileApprovalRequests.length} Decisions: ${session.mobileApprovalDecisions.length}`);
  }
  if (trackedSession) lines.push(`Session: ${trackedSession.sessionId}`);
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Authority only — no execution, push notifications, or real approvals.');
  return lines.join('\n');
}

export function buildMobileApprovalFailureContext(
  query: string,
): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isMobileApprovalRuntimeFoundationQuestion(query)) return [];
  return [
    {
      title: 'Mobile approval session blocked',
      description:
        'Registration rejected due to missing upstream links or duplicate mobile approval authority risk.',
      sourceSystem: 'mobile_approval_runtime_foundation',
    },
    {
      title: 'Approval request blocked',
      description: 'Approval request metadata blocked — inspect command, chat, and preview upstream authorities.',
      sourceSystem: 'mobile_approval_runtime_foundation',
    },
    {
      title: 'Decision metadata deferred',
      description: 'Decision could not be finalized — additional context or founder review required.',
      sourceSystem: 'mobile_approval_runtime_foundation',
    },
    {
      title: 'Parallel mobile approval authority risk',
      description: 'Duplicate mobile approval authority detected — use Mobile Approval Runtime Foundation.',
      sourceSystem: 'mobile_approval_runtime_foundation',
    },
  ];
}
