/**
 * DevPulse V2 Phase 18.7 — Founder Inbox Foundation public API.
 */

import { resetFounderInboxStoreForTests } from './founder-inbox-store.js';
import { resetInboxDiagnosticsForTests } from './founder-inbox-diagnostics.js';
import { resetFounderInboxReportCounterForTests } from './founder-inbox-report-builder.js';
import { resetFounderInboxBootstrapForTests } from './founder-inbox-registry.js';
import { resetFounderInboxReadCacheForTests } from './read-cache.js';

export {
  FOUNDER_INBOX_FOUNDATION_PASS_TOKEN,
  FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
  DUPLICATE_INBOX_AUTHORITY_RISK_PREFIX,
  TRACKED_INBOX_CATEGORIES,
  TRACKED_INBOX_PRIORITIES,
  FORBIDDEN_INBOX_DUPLICATES,
  INBOX_COMPANION_DOMAINS,
  FOUNDER_INBOX_QUESTION_SIGNALS,
  isFounderInboxFoundationQuestion,
  isDuplicateInboxExecutorQuestion,
  isValidInboxStateTransition,
  validateInboxState,
  type InboxCategory,
  type InboxPriority,
  type InboxState,
  type InboxStatus,
  type InboxLifecycleEventType,
  type InboxReportType,
  type InboxOwnership,
  type InboxVisibility,
  type InboxContext,
  type InboxPriorityMeta,
  type InboxArchiveRecord,
  type InboxAcknowledgement,
  type InboxNotificationLink,
  type InboxCrossDeviceLink,
  type InboxCloudLink,
  type InboxCommandLink,
  type InboxChatLink,
  type InboxPreviewLink,
  type InboxApprovalLink,
  type InboxOperatorFeedLink,
  type InboxProjectVaultLink,
  type InboxMetadata,
  type InboxProvenance,
  type FounderInboxEntry,
  type InboxLifecycleEvent,
  type InboxHistoryEntry,
  type InboxStateHistoryEntry,
  type InboxReport,
  type InboxDiagnostics,
  type InboxValidationResult,
  type RegisterInboxEntryInput,
  type RegisterInboxEntryResult,
  type PrepareFounderInboxFoundationInput,
  type PrepareFounderInboxFoundationResult,
  type DuplicateInboxRiskContext,
} from './founder-inbox-types.js';

export {
  resetFounderInboxStoreForTests,
  nextInboxEntryId,
  nextInboxReportId,
} from './founder-inbox-store.js';
export {
  buildInboxOwnership,
  recordInboxOwnershipHistory,
  registerInboxOwnership,
} from './founder-inbox-ownership.js';
export {
  buildDefaultInboxContext,
  refreshInboxContext,
  getInboxContextById,
  validateInboxContext,
  detectInboxContextMismatch,
} from './founder-inbox-context.js';
export {
  buildDefaultInboxVisibility,
  registerInboxVisibility,
  getInboxVisibility,
  validateInboxVisibility,
} from './founder-inbox-visibility.js';
export {
  buildDefaultInboxPriority,
  registerInboxPriority,
  getInboxPriority,
  listInboxEntriesByPriority,
} from './founder-inbox-priority.js';
export {
  filterByProject,
  filterByRuntime,
  filterByPriority,
  filterByCategory,
  filterByDevice,
  filterByCrossDeviceSession,
  filterUnread,
  filterAcknowledged,
  filterArchived,
} from './founder-inbox-filtering.js';
export {
  searchInbox,
  searchNotifications,
  searchProjects,
  searchRuntimeReferences,
} from './founder-inbox-search.js';
export {
  groupByProject,
  groupByPriority,
  groupByCategory,
  groupByRuntime,
  groupByDevice,
} from './founder-inbox-grouping.js';
export {
  acknowledgeInboxEntry,
  unacknowledgeInboxEntry,
} from './founder-inbox-acknowledgement.js';
export {
  archiveInboxEntry,
  restoreInboxEntry,
} from './founder-inbox-archive.js';
export {
  linkInboxToNotification,
  getNotificationForInbox,
  listInboxEntriesByNotification,
  detectInboxNotificationMismatch,
  findNotificationByName,
} from './founder-inbox-notification-bridge.js';
export {
  linkInboxToCrossDevice,
  getCrossDeviceForInbox,
  listInboxEntriesByCrossDevice,
  detectInboxCrossDeviceMismatch,
} from './founder-inbox-cross-device-bridge.js';
export {
  linkInboxToCloud,
  getCloudForInbox,
  listInboxEntriesByCloud,
  detectInboxCloudMismatch,
} from './founder-inbox-cloud-bridge.js';
export {
  linkInboxToCommand,
  getCommandForInbox,
  listInboxEntriesByCommand,
  detectInboxCommandMismatch,
} from './founder-inbox-command-bridge.js';
export {
  linkInboxToChat,
  getChatForInbox,
  listInboxEntriesByChat,
  detectInboxChatMismatch,
} from './founder-inbox-chat-bridge.js';
export {
  linkInboxToPreview,
  getPreviewForInbox,
  listInboxEntriesByPreview,
  detectInboxPreviewMismatch,
} from './founder-inbox-preview-bridge.js';
export {
  linkInboxToApproval,
  getApprovalForInbox,
  listInboxEntriesByApproval,
  detectInboxApprovalMismatch,
} from './founder-inbox-approval-bridge.js';
export {
  linkInboxToOperatorFeed,
  getOperatorFeedForInbox,
  listInboxEntriesByOperatorFeed,
  detectInboxOperatorFeedMismatch,
} from './founder-inbox-operator-feed-bridge.js';
export {
  linkInboxToProjectVault,
  getProjectVaultForInbox,
  listInboxEntriesByProjectVault,
  detectInboxProjectVaultMismatch,
} from './founder-inbox-project-vault-bridge.js';
export { setInboxState, getInboxState, trackInboxStateHistory } from './founder-inbox-state-manager.js';
export {
  createInboxEntry,
  getInboxEntry,
  listInboxEntries,
  trackInboxMetadata,
  trackInboxOwnership,
} from './founder-inbox-manager.js';
export { getInboxHistory, listInboxHistoryConsumers, recordInboxHistoryEntry } from './founder-inbox-history.js';
export {
  queryInboxEntries,
  listInboxEntriesAll,
  listInboxEntriesByProject,
  listInboxEntriesByRuntime,
  listInboxEntriesByWorkspace,
  listInboxEntriesByPersistentBuild,
  listInboxEntriesByDevice,
  listInboxEntriesByCrossDeviceSession,
  listInboxEntriesByCategory,
  countInboxEntriesByState,
  type InboxQuery,
} from './founder-inbox-query.js';
export {
  buildDuplicateInboxRiskContext,
  evaluateDuplicateInboxRisk,
  validateInboxRegistration,
  validateInboxRecord,
} from './founder-inbox-validator.js';
export {
  getInboxDiagnostics,
  updateInboxDiagnostics,
  resetInboxDiagnosticsForTests,
  runInboxDiagnosticsScan,
} from './founder-inbox-diagnostics.js';
export {
  buildAllInboxReports,
  composeInboxResponse,
  buildInboxFailureContext,
  resetFounderInboxReportCounterForTests,
  buildInboxInventoryReport,
  buildInboxVisibilityReport,
  buildInboxOwnershipReport,
  buildInboxContextReport,
  buildInboxStateReport,
  buildInboxAcknowledgementReport,
  buildInboxArchiveReport,
  buildInboxSearchReport,
  buildInboxFilteringReport,
  buildInboxGroupingReport,
  buildInboxHistoryReport,
  buildInboxDiagnosticsReport,
  buildInboxNotificationLinkReport,
  buildInboxCrossDeviceReport,
  buildInboxCloudReport,
  buildInboxCommandReport,
  buildInboxChatReport,
  buildInboxPreviewReport,
  buildInboxApprovalReport,
  buildInboxOperatorFeedReport,
  buildInboxProjectVaultReport,
} from './founder-inbox-report-builder.js';
export {
  registerInboxEntry,
  registerInboxOwnershipRecord,
  prepareFounderInboxFoundation,
  processFounderInboxRequest,
  getFounderInboxContext,
  resetFounderInboxBootstrapForTests,
} from './founder-inbox-registry.js';

export function getDevPulseV2FounderInboxFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_founder_inbox_foundation',
    passToken: 'FOUNDER_INBOX_FOUNDATION_V1_PASS',
    phase: 18.7,
    extensionOnly: true,
  };
}

export function resetFounderInboxFoundationForTests(): void {
  resetFounderInboxStoreForTests();
  resetInboxDiagnosticsForTests();
  resetFounderInboxReportCounterForTests();
  resetFounderInboxBootstrapForTests();
  resetFounderInboxReadCacheForTests();
}
