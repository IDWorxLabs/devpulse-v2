/**
 * Founder Inbox Foundation — report builder.
 */

import {
  listStoredInboxEntries,
  listStoredInboxLifecycleEvents,
  nextInboxReportId,
  resetFounderInboxReportCounterForTests as resetStoreReportCounterForTests,
} from './founder-inbox-store.js';
import { getInboxHistory } from './founder-inbox-history.js';
import { getInboxDiagnostics, runInboxDiagnosticsScan } from './founder-inbox-diagnostics.js';
import { detectInboxNotificationMismatch } from './founder-inbox-notification-bridge.js';
import { detectInboxCrossDeviceMismatch } from './founder-inbox-cross-device-bridge.js';
import { detectInboxCloudMismatch } from './founder-inbox-cloud-bridge.js';
import { detectInboxCommandMismatch } from './founder-inbox-command-bridge.js';
import { detectInboxChatMismatch } from './founder-inbox-chat-bridge.js';
import { detectInboxPreviewMismatch } from './founder-inbox-preview-bridge.js';
import { detectInboxApprovalMismatch } from './founder-inbox-approval-bridge.js';
import { groupByCategory, groupByPriority, groupByProject } from './founder-inbox-grouping.js';
import { filterArchived, filterUnread } from './founder-inbox-filtering.js';
import { searchInbox } from './founder-inbox-search.js';
import { isFounderInboxFoundationQuestion } from './founder-inbox-types.js';
import type { InboxReport, InboxReportType } from './founder-inbox-types.js';

export function resetFounderInboxReportCounterForTests(): void {
  resetStoreReportCounterForTests();
}

function buildReport(reportType: InboxReportType, summary: string, findings: string[]): InboxReport {
  const entries = listStoredInboxEntries();
  const events = listStoredInboxLifecycleEvents();
  return {
    reportId: nextInboxReportId(),
    reportType,
    generatedAt: Date.now(),
    inboxEntryCount: entries.length,
    lifecycleEventCount: events.length,
    summary,
    findings,
    visualizationOnly: true,
  };
}

export function buildInboxInventoryReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId} — ${e.inboxMetadata.inboxEntryName} (${e.inboxCategory}) state=${e.inboxState} notification=${e.notificationId}`,
  );
  return buildReport(
    'INBOX_INVENTORY_REPORT',
    `Inbox inventory — ${entries.length} entries`,
    findings.length ? findings : ['No inbox entries'],
  );
}

export function buildInboxOwnershipReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: project=${e.inboxOwnership.projectId} notification=${e.inboxOwnership.notificationId}`,
  );
  return buildReport(
    'INBOX_OWNERSHIP_REPORT',
    `Ownership — ${entries.length} records`,
    findings.length ? findings : ['No ownership records'],
  );
}

export function buildInboxVisibilityReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: inbox=${e.inboxVisibility.visibleInInbox} mobile=${e.inboxVisibility.visibleOnMobile}`,
  );
  return buildReport(
    'INBOX_VISIBILITY_REPORT',
    `Visibility — ${entries.length} records`,
    findings.length ? findings : ['No visibility records'],
  );
}

export function buildInboxContextReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) => `${e.inboxEntryId}: project=${e.inboxContext.projectId} approval=${e.inboxContext.approvalId}`,
  );
  return buildReport(
    'INBOX_CONTEXT_REPORT',
    `Context — ${entries.length} records`,
    findings.length ? findings : ['No context'],
  );
}

export function buildInboxStateReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map((e) => `${e.inboxEntryId}: ${e.inboxState}`);
  return buildReport(
    'INBOX_STATE_REPORT',
    `State — ${entries.length} records`,
    findings.length ? findings : ['No state records'],
  );
}

export function buildInboxAcknowledgementReport(): InboxReport {
  const entries = listStoredInboxEntries().filter((e) => e.inboxAcknowledgement !== null);
  const findings = entries.map(
    (e) => `${e.inboxEntryId}: ack=${e.inboxAcknowledgement?.acknowledgementId} at=${e.inboxAcknowledgement?.acknowledgedAt}`,
  );
  return buildReport(
    'INBOX_ACKNOWLEDGEMENT_REPORT',
    `Acknowledgement — ${entries.length} records`,
    findings.length ? findings : ['No acknowledgements'],
  );
}

export function buildInboxArchiveReport(): InboxReport {
  const entries = listStoredInboxEntries().filter((e) => e.inboxArchive !== null);
  const findings = entries.map(
    (e) => `${e.inboxEntryId}: archive=${e.inboxArchive?.archiveId} restored=${e.inboxArchive?.restored}`,
  );
  return buildReport(
    'INBOX_ARCHIVE_REPORT',
    `Archive — ${entries.length} records`,
    findings.length ? findings : ['No archives'],
  );
}

export function buildInboxSearchReport(): InboxReport {
  const results = searchInbox('inbox');
  const findings = results.map((e) => `${e.inboxEntryId}: ${e.inboxMetadata.inboxEntryName}`);
  return buildReport(
    'INBOX_SEARCH_REPORT',
    `Search — ${results.length} matches`,
    findings.length ? findings : ['No search results'],
  );
}

export function buildInboxFilteringReport(): InboxReport {
  const unread = filterUnread();
  const archived = filterArchived();
  const findings = [
    `unread: ${unread.length}`,
    `archived: ${archived.length}`,
    ...unread.slice(0, 5).map((e) => `unread ${e.inboxEntryId}`),
  ];
  return buildReport('INBOX_FILTERING_REPORT', `Filtering — ${unread.length} unread`, findings);
}

export function buildInboxGroupingReport(): InboxReport {
  const byCategory = groupByCategory();
  const byPriority = groupByPriority();
  const byProject = groupByProject();
  const findings = [
    `categories: ${Object.keys(byCategory).length}`,
    `priorities: ${Object.keys(byPriority).length}`,
    `projects: ${Object.keys(byProject).length}`,
  ];
  return buildReport('INBOX_GROUPING_REPORT', 'Grouping summary', findings);
}

export function buildInboxHistoryReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const allHistory = entries.flatMap((e) => getInboxHistory(e.inboxEntryId));
  const findings = allHistory.slice(-20).map((e) => `${e.inboxEntryId} [${e.category}]: ${e.summary}`);
  return buildReport(
    'INBOX_HISTORY_REPORT',
    `History — ${allHistory.length} entries`,
    findings.length ? findings : ['No history'],
  );
}

export function buildInboxDiagnosticsReport(): InboxReport {
  const diag = getInboxDiagnostics();
  runInboxDiagnosticsScan();
  const findings = [
    `Visualization active: ${diag.inboxVisualizationActive}`,
    `Registered entries: ${diag.registeredInboxEntryCount}`,
    `Unread: ${diag.unreadInboxEntryCount}`,
    `Notification mismatches: ${diag.notificationMismatchCount}`,
    `Cross device mismatches: ${diag.crossDeviceMismatchCount}`,
  ];
  return buildReport('INBOX_DIAGNOSTICS_REPORT', 'Diagnostics — visualization validation only', findings);
}

export function buildInboxNotificationLinkReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: notification=${e.inboxNotificationLink.notificationId} mismatch=${detectInboxNotificationMismatch(e.inboxEntryId)}`,
  );
  return buildReport(
    'INBOX_NOTIFICATION_LINK_REPORT',
    `Notification links — ${entries.length}`,
    findings.length ? findings : ['No notification links'],
  );
}

export function buildInboxCrossDeviceReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: crossDevice=${e.inboxCrossDeviceLink.crossDeviceSessionId} mismatch=${detectInboxCrossDeviceMismatch(e.inboxEntryId)}`,
  );
  return buildReport(
    'INBOX_CROSS_DEVICE_REPORT',
    `Cross device links — ${entries.length}`,
    findings.length ? findings : ['No cross device links'],
  );
}

export function buildInboxCloudReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: runtime=${e.inboxCloudLink.runtimeId} mismatch=${detectInboxCloudMismatch(e.inboxEntryId)}`,
  );
  return buildReport(
    'INBOX_CLOUD_REPORT',
    `Cloud links — ${entries.length}`,
    findings.length ? findings : ['No cloud links'],
  );
}

export function buildInboxCommandReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: command=${e.inboxCommandLink.commandSessionId} mismatch=${detectInboxCommandMismatch(e.inboxEntryId)}`,
  );
  return buildReport(
    'INBOX_COMMAND_REPORT',
    `Command links — ${entries.length}`,
    findings.length ? findings : ['No command links'],
  );
}

export function buildInboxChatReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: chat=${e.inboxChatLink.chatSessionId} mismatch=${detectInboxChatMismatch(e.inboxEntryId)}`,
  );
  return buildReport(
    'INBOX_CHAT_REPORT',
    `Chat links — ${entries.length}`,
    findings.length ? findings : ['No chat links'],
  );
}

export function buildInboxPreviewReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: preview=${e.inboxPreviewLink.previewId} mismatch=${detectInboxPreviewMismatch(e.inboxEntryId)}`,
  );
  return buildReport(
    'INBOX_PREVIEW_REPORT',
    `Preview links — ${entries.length}`,
    findings.length ? findings : ['No preview links'],
  );
}

export function buildInboxApprovalReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: approval=${e.inboxApprovalLink.approvalId} mismatch=${detectInboxApprovalMismatch(e.inboxEntryId)}`,
  );
  return buildReport(
    'INBOX_APPROVAL_REPORT',
    `Approval links — ${entries.length}`,
    findings.length ? findings : ['No approval links'],
  );
}

export function buildInboxOperatorFeedReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: feed=${e.inboxOperatorFeedLink.feedAuthorityId} mismatch=${e.inboxOperatorFeedLink.mismatchDetected}`,
  );
  return buildReport(
    'INBOX_OPERATOR_FEED_REPORT',
    `Operator feed links — ${entries.length}`,
    findings.length ? findings : ['No operator feed links'],
  );
}

export function buildInboxProjectVaultReport(): InboxReport {
  const entries = listStoredInboxEntries();
  const findings = entries.map(
    (e) =>
      `${e.inboxEntryId}: vault=${e.inboxProjectVaultLink.vaultProjectId} mismatch=${e.inboxProjectVaultLink.mismatchDetected}`,
  );
  return buildReport(
    'INBOX_PROJECT_VAULT_REPORT',
    `Project vault links — ${entries.length}`,
    findings.length ? findings : ['No project vault links'],
  );
}

export function buildAllInboxReports(): InboxReport[] {
  return [
    buildInboxInventoryReport(),
    buildInboxVisibilityReport(),
    buildInboxOwnershipReport(),
    buildInboxContextReport(),
    buildInboxStateReport(),
    buildInboxAcknowledgementReport(),
    buildInboxArchiveReport(),
    buildInboxSearchReport(),
    buildInboxFilteringReport(),
    buildInboxGroupingReport(),
    buildInboxHistoryReport(),
    buildInboxDiagnosticsReport(),
    buildInboxNotificationLinkReport(),
    buildInboxCrossDeviceReport(),
    buildInboxCloudReport(),
    buildInboxCommandReport(),
    buildInboxChatReport(),
    buildInboxPreviewReport(),
    buildInboxApprovalReport(),
    buildInboxOperatorFeedReport(),
    buildInboxProjectVaultReport(),
  ];
}

export function composeInboxResponse(
  query: string,
  entry: import('./founder-inbox-types.js').FounderInboxEntry | null,
  reports: InboxReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Founder Inbox Foundation: BLOCKED' : 'Founder Inbox Foundation: READY');
  lines.push(`Query: ${query}`);
  if (entry) {
    lines.push(`Inbox Entry: ${entry.inboxEntryId} — ${entry.inboxMetadata.inboxEntryName}`);
    lines.push(`Notification Ref: ${entry.notificationId}`);
    lines.push(`State: ${entry.inboxState}`);
    lines.push(`Category: ${entry.inboxCategory} Priority: ${entry.inboxPriority.priority}`);
  }
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Visualization only — references Founder Notification Runtime; no notification authority.');
  return lines.join('\n');
}

export function buildInboxFailureContext(
  query: string,
): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isFounderInboxFoundationQuestion(query)) return [];
  return [
    {
      title: 'Inbox entry registration blocked',
      description: 'Registration rejected due to missing notification reference or duplicate inbox authority risk.',
      sourceSystem: 'founder_inbox_foundation',
    },
    {
      title: 'Inbox visualization blocked',
      description: 'Visualization could not be finalized — inspect notification runtime upstream authority.',
      sourceSystem: 'founder_inbox_foundation',
    },
    {
      title: 'Inbox filter/search deferred',
      description: 'Filter or search could not complete — additional context or founder review required.',
      sourceSystem: 'founder_inbox_foundation',
    },
    {
      title: 'Parallel inbox authority risk',
      description: 'Duplicate inbox authority detected — use Founder Inbox Foundation visualization layer.',
      sourceSystem: 'founder_inbox_foundation',
    },
  ];
}
