/**
 * DevPulse V2 Phase 18.7 — Founder Inbox Foundation types.
 * Visualization/organization layer only — references Founder Notification Runtime; no notification authority.
 */

export const FOUNDER_INBOX_FOUNDATION_PASS_TOKEN = 'FOUNDER_INBOX_FOUNDATION_V1_PASS';
export const FOUNDER_INBOX_FOUNDATION_OWNER_MODULE = 'devpulse_v2_founder_inbox_foundation';
export const DUPLICATE_INBOX_AUTHORITY_RISK_PREFIX = 'DUPLICATE_INBOX_AUTHORITY_RISK';

export type InboxCategory =
  | 'GENERAL_INBOX'
  | 'PROJECT_INBOX'
  | 'MOBILE_INBOX'
  | 'CLOUD_INBOX'
  | 'WORLD2_INBOX'
  | 'AUTONOMOUS_BUILDER_INBOX'
  | 'AIDEV_INBOX'
  | 'APPROVAL_INBOX'
  | 'PREVIEW_INBOX'
  | 'COMMAND_INBOX'
  | 'CHAT_INBOX'
  | 'SYSTEM_INBOX';

export type InboxPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'INFORMATIONAL';

export type InboxState =
  | 'CREATED'
  | 'VISIBLE'
  | 'UNREAD'
  | 'READ'
  | 'ACKNOWLEDGED'
  | 'ARCHIVED'
  | 'HIDDEN'
  | 'FAILED';

export type InboxStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type InboxLifecycleEventType =
  | 'INBOX_ENTRY_CREATED'
  | 'INBOX_ENTRY_VISIBLE'
  | 'INBOX_ENTRY_READ'
  | 'INBOX_ENTRY_ACKNOWLEDGED'
  | 'INBOX_ENTRY_ARCHIVED'
  | 'INBOX_ENTRY_RESTORED'
  | 'INBOX_ENTRY_FAILED';

export type InboxReportType =
  | 'INBOX_INVENTORY_REPORT'
  | 'INBOX_VISIBILITY_REPORT'
  | 'INBOX_OWNERSHIP_REPORT'
  | 'INBOX_CONTEXT_REPORT'
  | 'INBOX_STATE_REPORT'
  | 'INBOX_ACKNOWLEDGEMENT_REPORT'
  | 'INBOX_ARCHIVE_REPORT'
  | 'INBOX_SEARCH_REPORT'
  | 'INBOX_FILTERING_REPORT'
  | 'INBOX_GROUPING_REPORT'
  | 'INBOX_HISTORY_REPORT'
  | 'INBOX_DIAGNOSTICS_REPORT'
  | 'INBOX_NOTIFICATION_LINK_REPORT'
  | 'INBOX_CROSS_DEVICE_REPORT'
  | 'INBOX_CLOUD_REPORT'
  | 'INBOX_COMMAND_REPORT'
  | 'INBOX_CHAT_REPORT'
  | 'INBOX_PREVIEW_REPORT'
  | 'INBOX_APPROVAL_REPORT'
  | 'INBOX_OPERATOR_FEED_REPORT'
  | 'INBOX_PROJECT_VAULT_REPORT';

export const TRACKED_INBOX_CATEGORIES: readonly InboxCategory[] = [
  'GENERAL_INBOX',
  'PROJECT_INBOX',
  'MOBILE_INBOX',
  'CLOUD_INBOX',
  'WORLD2_INBOX',
  'AUTONOMOUS_BUILDER_INBOX',
  'AIDEV_INBOX',
  'APPROVAL_INBOX',
  'PREVIEW_INBOX',
  'COMMAND_INBOX',
  'CHAT_INBOX',
  'SYSTEM_INBOX',
] as const;

export const TRACKED_INBOX_PRIORITIES: readonly InboxPriority[] = [
  'CRITICAL',
  'HIGH',
  'NORMAL',
  'LOW',
  'INFORMATIONAL',
] as const;

export const FORBIDDEN_INBOX_DUPLICATES = [
  'inbox_executor',
  'inbox_worker',
  'parallel_inbox_authority',
  'inbox_notification_engine',
  'notification_inbox_authority',
] as const;

export const INBOX_COMPANION_DOMAINS = [
  'founder_inbox_foundation',
  'founder_notification_runtime_foundation',
  'cross_device_runtime_foundation',
  'mobile_approval_runtime_foundation',
  'mobile_command_runtime_foundation',
  'mobile_chat_runtime_foundation',
  'mobile_preview_runtime_foundation',
] as const;

export const FOUNDER_INBOX_QUESTION_SIGNALS = [
  'founder inbox',
  'founder inbox foundation',
  'founder inbox inventory',
  'inbox visualization',
  'inbox organization',
  'inbox entry',
  'inbox entries',
  'inbox filter',
  'inbox search',
  'inbox group',
  'inbox archive',
  'inbox acknowledge',
  'inbox acknowledgement',
  'inbox priority',
  'inbox visibility',
  'inbox state',
  'inbox history',
  'inbox diagnostics',
  'register inbox',
  'list inbox',
  'inbox entry created',
  'inbox entry visible',
  'inbox entry read',
  'inbox entry acknowledged',
  'inbox entry archived',
  'inbox entry restored',
  'inbox entry failed',
  'inbox notification link',
  'inbox cross device',
  'inbox cloud link',
  'inbox command link',
  'inbox chat link',
  'inbox preview link',
  'inbox approval link',
  'inbox operator feed',
  'inbox project vault',
  'visualization only inbox',
  'no notification authority',
  'filter inbox',
  'search inbox',
  'group inbox',
] as const;

export interface InboxOwnership {
  inboxEntryId: string;
  notificationId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  ownerModule: string;
  ownerDomain: string;
  creationTimestamp: number;
}

export interface InboxVisibility {
  visibleInInbox: boolean;
  visibleOnMobile: boolean;
  visibleOnDesktop: boolean;
  visibleOnCloud: boolean;
  visibleInOperatorFeed: boolean;
  visibleInProjectVault: boolean;
  visibilityReason: string;
}

export interface InboxContext {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  approvalId: string;
  previewId: string;
  commandSessionId: string;
  chatSessionId: string;
  crossDeviceSessionId: string;
  operatorFeedEventId: string;
}

export interface InboxPriorityMeta {
  priority: InboxPriority;
  priorityReason: string;
  escalated: boolean;
  escalationReason: string | null;
}

export interface InboxArchiveRecord {
  archiveId: string;
  inboxEntryId: string;
  archivedAt: number;
  archiveReason: string;
  archivedBy: string;
  restored: boolean;
  restoredAt: number | null;
}

export interface InboxAcknowledgement {
  acknowledgementId: string;
  inboxEntryId: string;
  acknowledgedAt: number;
  acknowledgedBy: string;
  acknowledgementReason: string;
  unacknowledged: boolean;
  unacknowledgedAt: number | null;
}

export interface InboxNotificationLink {
  notificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface InboxCrossDeviceLink {
  crossDeviceSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface InboxCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface InboxCommandLink {
  commandSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface InboxChatLink {
  chatSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface InboxPreviewLink {
  previewId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface InboxApprovalLink {
  approvalId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface InboxOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface InboxProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface InboxMetadata {
  inboxEntryName: string;
  inboxEntryDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface InboxProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface FounderInboxEntry {
  inboxEntryId: string;
  notificationId: string;
  inboxCategory: InboxCategory;
  inboxState: InboxState;
  inboxStatus: InboxStatus;
  inboxOwnership: InboxOwnership;
  inboxVisibility: InboxVisibility;
  inboxContext: InboxContext;
  inboxPriority: InboxPriorityMeta;
  inboxMetadata: InboxMetadata;
  inboxProvenance: InboxProvenance;
  inboxArchive: InboxArchiveRecord | null;
  inboxAcknowledgement: InboxAcknowledgement | null;
  inboxNotificationLink: InboxNotificationLink;
  inboxCrossDeviceLink: InboxCrossDeviceLink;
  inboxCloudLink: InboxCloudLink;
  inboxCommandLink: InboxCommandLink;
  inboxChatLink: InboxChatLink;
  inboxPreviewLink: InboxPreviewLink;
  inboxApprovalLink: InboxApprovalLink;
  inboxOperatorFeedLink: InboxOperatorFeedLink;
  inboxProjectVaultLink: InboxProjectVaultLink;
  createdAt: number;
  updatedAt: number;
}

export interface InboxLifecycleEvent {
  eventId: string;
  inboxEntryId: string;
  eventType: InboxLifecycleEventType;
  previousState: InboxState | null;
  newState: InboxState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface InboxHistoryEntry {
  entryId: string;
  inboxEntryId: string;
  category:
    | 'INBOX'
    | 'OWNERSHIP'
    | 'VISIBILITY'
    | 'PRIORITY'
    | 'STATE'
    | 'NOTIFICATION'
    | 'CROSS_DEVICE'
    | 'CLOUD'
    | 'COMMAND'
    | 'CHAT'
    | 'PREVIEW'
    | 'APPROVAL'
    | 'OPERATOR_FEED'
    | 'PROJECT_VAULT'
    | 'CONTEXT'
    | 'ARCHIVE'
    | 'ACKNOWLEDGEMENT'
    | 'LIFECYCLE'
    | 'SEARCH'
    | 'FILTER'
    | 'GROUP';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface InboxStateHistoryEntry {
  inboxEntryId: string;
  previousState: InboxState | null;
  newState: InboxState;
  timestamp: number;
}

export interface InboxReport {
  reportId: string;
  reportType: InboxReportType;
  generatedAt: number;
  inboxEntryCount: number;
  lifecycleEventCount: number;
  summary: string;
  findings: string[];
  visualizationOnly: true;
}

export interface InboxDiagnostics {
  inboxVisualizationActive: boolean;
  registeredInboxEntryCount: number;
  visibleInboxEntryCount: number;
  unreadInboxEntryCount: number;
  readInboxEntryCount: number;
  acknowledgedInboxEntryCount: number;
  archivedInboxEntryCount: number;
  hiddenInboxEntryCount: number;
  failedInboxEntryCount: number;
  duplicateRiskCount: number;
  notificationMismatchCount: number;
  crossDeviceMismatchCount: number;
  cloudMismatchCount: number;
  commandMismatchCount: number;
  chatMismatchCount: number;
  previewMismatchCount: number;
  approvalMismatchCount: number;
  lastQuery: string | null;
  lastState: InboxState | null;
}

export interface InboxValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterInboxEntryInput {
  inboxEntryName: string;
  notificationId: string;
  inboxCategory?: InboxCategory;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  approvalId: string;
  previewId: string;
  commandSessionId: string;
  chatSessionId: string;
  inboxEntryDescription?: string;
  priority?: InboxPriority;
  visibility?: InboxVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterInboxEntryResult {
  entry: FounderInboxEntry | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareFounderInboxFoundationInput {
  query?: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  approvalId: string;
  previewId: string;
  commandSessionId: string;
  chatSessionId: string;
  notificationId?: string;
  inboxEntryName?: string;
  inboxCategory?: InboxCategory;
  projectExists?: boolean;
  commandSessionExists?: boolean;
  chatSessionExists?: boolean;
  previewSessionExists?: boolean;
  approvalSessionExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  crossDeviceSessionExists?: boolean;
  notificationExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareFounderInboxFoundationResult {
  entry: FounderInboxEntry | null;
  reports: InboxReport[];
  diagnostics: InboxDiagnostics;
  validation: InboxValidationResult;
  responseText: string;
  visualizationOnly: true;
}

export interface DuplicateInboxRiskContext {
  inboxEntryName: string;
  inboxCategory: InboxCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  notificationSummaries: string[];
  crossDeviceSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
}

export function isFounderInboxFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  if (lower.includes('founder notification') && !lower.includes('founder inbox')) return false;
  return FOUNDER_INBOX_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateInboxExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_INBOX_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidInboxStateTransition(from: InboxState, to: InboxState): boolean {
  const allowed: Record<InboxState, InboxState[]> = {
    CREATED: ['VISIBLE', 'FAILED', 'HIDDEN', 'ARCHIVED'],
    VISIBLE: ['UNREAD', 'READ', 'FAILED', 'HIDDEN', 'ARCHIVED'],
    UNREAD: ['READ', 'ACKNOWLEDGED', 'FAILED', 'HIDDEN', 'ARCHIVED'],
    READ: ['ACKNOWLEDGED', 'FAILED', 'HIDDEN', 'ARCHIVED'],
    ACKNOWLEDGED: ['ARCHIVED', 'HIDDEN'],
    ARCHIVED: ['VISIBLE', 'UNREAD'],
    HIDDEN: ['VISIBLE', 'UNREAD'],
    FAILED: ['CREATED', 'VISIBLE', 'ARCHIVED'],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function validateInboxState(state: InboxState): boolean {
  const valid: InboxState[] = [
    'CREATED',
    'VISIBLE',
    'UNREAD',
    'READ',
    'ACKNOWLEDGED',
    'ARCHIVED',
    'HIDDEN',
    'FAILED',
  ];
  return valid.includes(state);
}
