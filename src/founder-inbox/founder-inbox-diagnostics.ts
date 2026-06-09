/**
 * Founder Inbox Foundation — diagnostics tracker.
 */

import { listStoredInboxEntries, listStoredInboxLifecycleEvents } from './founder-inbox-store.js';
import { detectInboxNotificationMismatch } from './founder-inbox-notification-bridge.js';
import { detectInboxCrossDeviceMismatch } from './founder-inbox-cross-device-bridge.js';
import { detectInboxCloudMismatch } from './founder-inbox-cloud-bridge.js';
import { detectInboxCommandMismatch } from './founder-inbox-command-bridge.js';
import { detectInboxChatMismatch } from './founder-inbox-chat-bridge.js';
import { detectInboxPreviewMismatch } from './founder-inbox-preview-bridge.js';
import { detectInboxApprovalMismatch } from './founder-inbox-approval-bridge.js';
import type { InboxDiagnostics, InboxState } from './founder-inbox-types.js';

let diagnostics: InboxDiagnostics = {
  inboxVisualizationActive: true,
  registeredInboxEntryCount: 0,
  visibleInboxEntryCount: 0,
  unreadInboxEntryCount: 0,
  readInboxEntryCount: 0,
  acknowledgedInboxEntryCount: 0,
  archivedInboxEntryCount: 0,
  hiddenInboxEntryCount: 0,
  failedInboxEntryCount: 0,
  duplicateRiskCount: 0,
  notificationMismatchCount: 0,
  crossDeviceMismatchCount: 0,
  cloudMismatchCount: 0,
  commandMismatchCount: 0,
  chatMismatchCount: 0,
  previewMismatchCount: 0,
  approvalMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getInboxDiagnostics(): InboxDiagnostics {
  return { ...diagnostics };
}

export function updateInboxDiagnostics(
  query: string,
  lastState: InboxState | null,
  duplicateRiskCount = 0,
): InboxDiagnostics {
  const entries = listStoredInboxEntries();
  diagnostics = {
    inboxVisualizationActive: true,
    registeredInboxEntryCount: entries.length,
    visibleInboxEntryCount: entries.filter((e) =>
      ['VISIBLE', 'UNREAD', 'READ', 'ACKNOWLEDGED'].includes(e.inboxState),
    ).length,
    unreadInboxEntryCount: entries.filter((e) => e.inboxState === 'UNREAD' || e.inboxState === 'VISIBLE').length,
    readInboxEntryCount: entries.filter((e) =>
      ['READ', 'ACKNOWLEDGED', 'ARCHIVED'].includes(e.inboxState),
    ).length,
    acknowledgedInboxEntryCount: entries.filter((e) =>
      e.inboxState === 'ACKNOWLEDGED' || e.inboxAcknowledgement !== null,
    ).length,
    archivedInboxEntryCount: entries.filter((e) => e.inboxState === 'ARCHIVED' || e.inboxArchive !== null).length,
    hiddenInboxEntryCount: entries.filter((e) => e.inboxState === 'HIDDEN').length,
    failedInboxEntryCount: entries.filter((e) => e.inboxState === 'FAILED').length,
    duplicateRiskCount,
    notificationMismatchCount: entries.filter((e) => detectInboxNotificationMismatch(e.inboxEntryId)).length,
    crossDeviceMismatchCount: entries.filter((e) => detectInboxCrossDeviceMismatch(e.inboxEntryId)).length,
    cloudMismatchCount: entries.filter((e) => detectInboxCloudMismatch(e.inboxEntryId)).length,
    commandMismatchCount: entries.filter((e) => detectInboxCommandMismatch(e.inboxEntryId)).length,
    chatMismatchCount: entries.filter((e) => detectInboxChatMismatch(e.inboxEntryId)).length,
    previewMismatchCount: entries.filter((e) => detectInboxPreviewMismatch(e.inboxEntryId)).length,
    approvalMismatchCount: entries.filter((e) => detectInboxApprovalMismatch(e.inboxEntryId)).length,
    lastQuery: query,
    lastState,
  };
  return getInboxDiagnostics();
}

export function resetInboxDiagnosticsForTests(): void {
  diagnostics = {
    inboxVisualizationActive: true,
    registeredInboxEntryCount: 0,
    visibleInboxEntryCount: 0,
    unreadInboxEntryCount: 0,
    readInboxEntryCount: 0,
    acknowledgedInboxEntryCount: 0,
    archivedInboxEntryCount: 0,
    hiddenInboxEntryCount: 0,
    failedInboxEntryCount: 0,
    duplicateRiskCount: 0,
    notificationMismatchCount: 0,
    crossDeviceMismatchCount: 0,
    cloudMismatchCount: 0,
    commandMismatchCount: 0,
    chatMismatchCount: 0,
    previewMismatchCount: 0,
    approvalMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function runInboxDiagnosticsScan(): InboxDiagnostics {
  return updateInboxDiagnostics(diagnostics.lastQuery ?? 'scan', diagnostics.lastState);
}
