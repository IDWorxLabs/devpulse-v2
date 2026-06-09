/**
 * DevPulse V2 Phase 18.6 — Founder Notification Runtime Foundation types.
 * Founder notification authority only — no real delivery, push, email, or SMS.
 */

export const FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_PASS_TOKEN =
  'FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_V1_PASS';
export const FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE =
  'devpulse_v2_founder_notification_runtime_foundation';
export const DUPLICATE_NOTIFICATION_AUTHORITY_RISK_PREFIX = 'DUPLICATE_NOTIFICATION_AUTHORITY_RISK';

export type NotificationCategory =
  | 'GENERAL_NOTIFICATION'
  | 'FOUNDER_ALERT'
  | 'PROJECT_NOTIFICATION'
  | 'MOBILE_NOTIFICATION'
  | 'CLOUD_NOTIFICATION'
  | 'WORLD2_NOTIFICATION'
  | 'AUTONOMOUS_BUILDER_NOTIFICATION'
  | 'AIDEV_NOTIFICATION'
  | 'APPROVAL_NOTIFICATION'
  | 'PREVIEW_NOTIFICATION'
  | 'COMMAND_NOTIFICATION'
  | 'CHAT_NOTIFICATION'
  | 'SYSTEM_NOTIFICATION';

export type NotificationChannel =
  | 'IN_APP'
  | 'MOBILE'
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'OPERATOR_FEED'
  | 'PROJECT_VAULT'
  | 'UNKNOWN_CHANNEL';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'INFORMATIONAL';

export type NotificationState =
  | 'CREATED'
  | 'ROUTED'
  | 'VISIBLE'
  | 'VIEWED'
  | 'ACKNOWLEDGED'
  | 'DISMISSED'
  | 'ARCHIVED'
  | 'FAILED';

export type NotificationStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type NotificationLifecycleEventType =
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_ROUTED'
  | 'NOTIFICATION_VISIBLE'
  | 'NOTIFICATION_VIEWED'
  | 'NOTIFICATION_ACKNOWLEDGED'
  | 'NOTIFICATION_DISMISSED'
  | 'NOTIFICATION_ARCHIVED'
  | 'NOTIFICATION_FAILED';

export type NotificationReportType =
  | 'NOTIFICATION_INVENTORY_REPORT'
  | 'NOTIFICATION_OWNERSHIP_REPORT'
  | 'NOTIFICATION_VISIBILITY_REPORT'
  | 'NOTIFICATION_ROUTING_REPORT'
  | 'NOTIFICATION_PRIORITY_REPORT'
  | 'NOTIFICATION_CONTEXT_REPORT'
  | 'NOTIFICATION_STATE_REPORT'
  | 'NOTIFICATION_LIFECYCLE_REPORT'
  | 'NOTIFICATION_CHANNEL_REPORT'
  | 'NOTIFICATION_HISTORY_REPORT'
  | 'NOTIFICATION_DIAGNOSTICS_REPORT'
  | 'NOTIFICATION_MOBILE_LINK_REPORT'
  | 'NOTIFICATION_CROSS_DEVICE_REPORT'
  | 'NOTIFICATION_CLOUD_REPORT'
  | 'NOTIFICATION_COMMAND_REPORT'
  | 'NOTIFICATION_CHAT_REPORT'
  | 'NOTIFICATION_PREVIEW_REPORT'
  | 'NOTIFICATION_APPROVAL_REPORT'
  | 'NOTIFICATION_OPERATOR_FEED_REPORT'
  | 'NOTIFICATION_PROJECT_VAULT_REPORT';

export const TRACKED_NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = [
  'GENERAL_NOTIFICATION',
  'FOUNDER_ALERT',
  'PROJECT_NOTIFICATION',
  'MOBILE_NOTIFICATION',
  'CLOUD_NOTIFICATION',
  'WORLD2_NOTIFICATION',
  'AUTONOMOUS_BUILDER_NOTIFICATION',
  'AIDEV_NOTIFICATION',
  'APPROVAL_NOTIFICATION',
  'PREVIEW_NOTIFICATION',
  'COMMAND_NOTIFICATION',
  'CHAT_NOTIFICATION',
  'SYSTEM_NOTIFICATION',
] as const;

export const TRACKED_NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  'IN_APP',
  'MOBILE',
  'EMAIL',
  'SMS',
  'PUSH',
  'OPERATOR_FEED',
  'PROJECT_VAULT',
  'UNKNOWN_CHANNEL',
] as const;

export const TRACKED_NOTIFICATION_PRIORITIES: readonly NotificationPriority[] = [
  'CRITICAL',
  'HIGH',
  'NORMAL',
  'LOW',
  'INFORMATIONAL',
] as const;

export const FORBIDDEN_NOTIFICATION_DUPLICATES = [
  'notification_executor',
  'notification_worker',
  'parallel_notification_authority',
  'notification_delivery_engine',
  'push_notification_service',
  'email_notification_service',
  'sms_notification_service',
] as const;

export const NOTIFICATION_COMPANION_DOMAINS = [
  'founder_notification_runtime_foundation',
  'cross_device_runtime_foundation',
  'mobile_approval_runtime_foundation',
  'mobile_command_runtime_foundation',
  'mobile_chat_runtime_foundation',
  'mobile_preview_runtime_foundation',
] as const;

export const FOUNDER_NOTIFICATION_QUESTION_SIGNALS = [
  'founder notification',
  'founder notification runtime',
  'founder notification inventory',
  'founder notification foundation',
  'notification authority',
  'notification routing',
  'notification visibility',
  'notification priority',
  'notification channel',
  'notification state',
  'notification lifecycle',
  'notification context',
  'notification history',
  'notification diagnostics',
  'founder alert',
  'founder inbox',
  'register notification',
  'list notifications',
  'notification created',
  'notification routed',
  'notification visible',
  'notification viewed',
  'notification acknowledged',
  'notification dismissed',
  'notification archived',
  'notification failed',
  'notification mobile link',
  'notification cross device',
  'notification cloud link',
  'notification command link',
  'notification chat link',
  'notification preview link',
  'notification approval link',
  'notification operator feed',
  'notification project vault',
  'authority only notification',
  'no real delivery',
  'no push notifications',
] as const;

export interface NotificationOwnership {
  notificationId: string;
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  notificationAuthority: string;
  creationTimestamp: number;
}

export interface NotificationVisibility {
  visibleInFounderInbox: boolean;
  visibleInOperatorFeed: boolean;
  visibleInProjectVault: boolean;
  visibleOnMobile: boolean;
  visibleOnDesktop: boolean;
  visibleOnCloud: boolean;
  visibilityReason: string;
}

export interface NotificationRouting {
  routingId: string;
  notificationId: string;
  sourceRuntime: string;
  targetChannel: NotificationChannel;
  targetDevice: string;
  routingReason: string;
  routingTimestamp: number;
  routingStatus: 'PENDING' | 'ROUTED' | 'MISMATCH' | 'BLOCKED';
}

export interface NotificationContext {
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

export interface NotificationPriorityMeta {
  priority: NotificationPriority;
  priorityReason: string;
  escalated: boolean;
  escalationReason: string | null;
}

export interface NotificationChannelMeta {
  primaryChannel: NotificationChannel;
  fallbackChannels: NotificationChannel[];
  channelReason: string;
  deliveryBlocked: true;
}

export interface NotificationMobileLink {
  crossDeviceSessionId: string;
  deviceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface NotificationCrossDeviceLink {
  crossDeviceSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface NotificationCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface NotificationCommandLink {
  commandSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface NotificationChatLink {
  chatSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface NotificationPreviewLink {
  previewId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface NotificationApprovalLink {
  approvalId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface NotificationOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface NotificationProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface NotificationMetadata {
  notificationName: string;
  notificationDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface NotificationProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface FounderNotification {
  notificationId: string;
  notificationCategory: NotificationCategory;
  notificationState: NotificationState;
  notificationStatus: NotificationStatus;
  notificationOwnership: NotificationOwnership;
  notificationVisibility: NotificationVisibility;
  notificationRoutings: NotificationRouting[];
  notificationContext: NotificationContext;
  notificationPriority: NotificationPriorityMeta;
  notificationChannel: NotificationChannelMeta;
  notificationMetadata: NotificationMetadata;
  notificationProvenance: NotificationProvenance;
  notificationMobileLink: NotificationMobileLink;
  notificationCrossDeviceLink: NotificationCrossDeviceLink;
  notificationCloudLink: NotificationCloudLink;
  notificationCommandLink: NotificationCommandLink;
  notificationChatLink: NotificationChatLink;
  notificationPreviewLink: NotificationPreviewLink;
  notificationApprovalLink: NotificationApprovalLink;
  notificationOperatorFeedLink: NotificationOperatorFeedLink;
  notificationProjectVaultLink: NotificationProjectVaultLink;
  createdAt: number;
  updatedAt: number;
}

export interface NotificationLifecycleEvent {
  eventId: string;
  notificationId: string;
  eventType: NotificationLifecycleEventType;
  previousState: NotificationState | null;
  newState: NotificationState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface NotificationHistoryEntry {
  entryId: string;
  notificationId: string;
  category:
    | 'NOTIFICATION'
    | 'OWNERSHIP'
    | 'VISIBILITY'
    | 'ROUTING'
    | 'PRIORITY'
    | 'CHANNEL'
    | 'STATE'
    | 'MOBILE'
    | 'CROSS_DEVICE'
    | 'CLOUD'
    | 'COMMAND'
    | 'CHAT'
    | 'PREVIEW'
    | 'APPROVAL'
    | 'OPERATOR_FEED'
    | 'PROJECT_VAULT'
    | 'CONTEXT'
    | 'LIFECYCLE';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface NotificationStateHistoryEntry {
  notificationId: string;
  previousState: NotificationState | null;
  newState: NotificationState;
  timestamp: number;
}

export interface NotificationReport {
  reportId: string;
  reportType: NotificationReportType;
  generatedAt: number;
  notificationCount: number;
  routingCount: number;
  lifecycleEventCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface NotificationDiagnostics {
  notificationAuthorityActive: boolean;
  registeredNotificationCount: number;
  routedNotificationCount: number;
  visibleNotificationCount: number;
  viewedNotificationCount: number;
  acknowledgedNotificationCount: number;
  dismissedNotificationCount: number;
  archivedNotificationCount: number;
  failedNotificationCount: number;
  duplicateRiskCount: number;
  mobileMismatchCount: number;
  crossDeviceMismatchCount: number;
  cloudMismatchCount: number;
  commandMismatchCount: number;
  chatMismatchCount: number;
  previewMismatchCount: number;
  approvalMismatchCount: number;
  lastQuery: string | null;
  lastState: NotificationState | null;
}

export interface NotificationValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterNotificationInput {
  notificationName: string;
  notificationCategory?: NotificationCategory;
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
  notificationDescription?: string;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  createdBy?: string;
  visibility?: NotificationVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterNotificationResult {
  notification: FounderNotification | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareFounderNotificationRuntimeFoundationInput {
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
  notificationName?: string;
  notificationCategory?: NotificationCategory;
  projectExists?: boolean;
  commandSessionExists?: boolean;
  chatSessionExists?: boolean;
  previewSessionExists?: boolean;
  approvalSessionExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  crossDeviceSessionExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareFounderNotificationRuntimeFoundationResult {
  notification: FounderNotification | null;
  reports: NotificationReport[];
  diagnostics: NotificationDiagnostics;
  validation: NotificationValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateNotificationRiskContext {
  notificationName: string;
  notificationCategory: NotificationCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  mobileCommandSummaries: string[];
  mobileChatSummaries: string[];
  mobilePreviewSummaries: string[];
  mobileApprovalSummaries: string[];
  crossDeviceSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
}

export function isFounderNotificationRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return FOUNDER_NOTIFICATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateNotificationExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_NOTIFICATION_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidNotificationStateTransition(from: NotificationState, to: NotificationState): boolean {
  const allowed: Record<NotificationState, NotificationState[]> = {
    CREATED: ['ROUTED', 'FAILED', 'ARCHIVED'],
    ROUTED: ['VISIBLE', 'FAILED', 'ARCHIVED'],
    VISIBLE: ['VIEWED', 'FAILED', 'ARCHIVED'],
    VIEWED: ['ACKNOWLEDGED', 'DISMISSED', 'FAILED', 'ARCHIVED'],
    ACKNOWLEDGED: ['ARCHIVED', 'DISMISSED'],
    DISMISSED: ['ARCHIVED'],
    ARCHIVED: [],
    FAILED: ['ARCHIVED', 'CREATED', 'ROUTED'],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function validateNotificationState(state: NotificationState): boolean {
  const valid: NotificationState[] = [
    'CREATED',
    'ROUTED',
    'VISIBLE',
    'VIEWED',
    'ACKNOWLEDGED',
    'DISMISSED',
    'ARCHIVED',
    'FAILED',
  ];
  return valid.includes(state);
}
