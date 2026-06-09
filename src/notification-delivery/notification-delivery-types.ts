/**
 * DevPulse V2 Phase 18.8 — Notification Delivery Foundation types.
 * Delivery planning/routing/targeting/eligibility authority only — no real delivery.
 */

export const NOTIFICATION_DELIVERY_FOUNDATION_PASS_TOKEN = 'NOTIFICATION_DELIVERY_FOUNDATION_V1_PASS';
export const NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE = 'devpulse_v2_notification_delivery_foundation';
export const DUPLICATE_DELIVERY_AUTHORITY_RISK_PREFIX = 'DUPLICATE_DELIVERY_AUTHORITY_RISK';

export type DeliveryCategory =
  | 'GENERAL_DELIVERY'
  | 'FOUNDER_ALERT_DELIVERY'
  | 'PROJECT_DELIVERY'
  | 'MOBILE_DELIVERY'
  | 'INBOX_DELIVERY'
  | 'CLOUD_DELIVERY'
  | 'WORLD2_DELIVERY'
  | 'AUTONOMOUS_BUILDER_DELIVERY'
  | 'AIDEV_DELIVERY'
  | 'APPROVAL_DELIVERY'
  | 'PREVIEW_DELIVERY'
  | 'COMMAND_DELIVERY'
  | 'CHAT_DELIVERY'
  | 'SYSTEM_DELIVERY';

export type DeliveryChannel =
  | 'IN_APP'
  | 'FOUNDER_INBOX'
  | 'MOBILE'
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'OPERATOR_FEED'
  | 'PROJECT_VAULT'
  | 'UNKNOWN_CHANNEL';

export type DeliveryPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'INFORMATIONAL';

export type DeliveryState =
  | 'CREATED'
  | 'PLANNED'
  | 'ELIGIBILITY_CHECKED'
  | 'ROUTED'
  | 'TARGET_SELECTED'
  | 'BLOCKED'
  | 'DEFERRED'
  | 'READY'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type DeliveryStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type DeliveryLifecycleEventType =
  | 'DELIVERY_CREATED'
  | 'DELIVERY_PLANNED'
  | 'DELIVERY_ELIGIBILITY_CHECKED'
  | 'DELIVERY_ROUTED'
  | 'DELIVERY_TARGET_SELECTED'
  | 'DELIVERY_BLOCKED'
  | 'DELIVERY_DEFERRED'
  | 'DELIVERY_READY'
  | 'DELIVERY_COMPLETED'
  | 'DELIVERY_FAILED'
  | 'DELIVERY_ARCHIVED';

export type DeliveryReportType =
  | 'DELIVERY_INVENTORY_REPORT'
  | 'DELIVERY_OWNERSHIP_REPORT'
  | 'DELIVERY_CONTEXT_REPORT'
  | 'DELIVERY_INTENT_REPORT'
  | 'DELIVERY_ROUTING_REPORT'
  | 'DELIVERY_TARGETING_REPORT'
  | 'DELIVERY_CHANNEL_ELIGIBILITY_REPORT'
  | 'DELIVERY_POLICY_REPORT'
  | 'DELIVERY_BLOCKING_REPORT'
  | 'DELIVERY_DEFERRAL_REPORT'
  | 'DELIVERY_VISIBILITY_REPORT'
  | 'DELIVERY_STATE_REPORT'
  | 'DELIVERY_LIFECYCLE_REPORT'
  | 'DELIVERY_HISTORY_REPORT'
  | 'DELIVERY_DIAGNOSTICS_REPORT'
  | 'DELIVERY_NOTIFICATION_LINK_REPORT'
  | 'DELIVERY_INBOX_LINK_REPORT'
  | 'DELIVERY_CROSS_DEVICE_REPORT'
  | 'DELIVERY_CLOUD_REPORT'
  | 'DELIVERY_COMMAND_REPORT'
  | 'DELIVERY_CHAT_REPORT'
  | 'DELIVERY_PREVIEW_REPORT'
  | 'DELIVERY_APPROVAL_REPORT'
  | 'DELIVERY_OPERATOR_FEED_REPORT'
  | 'DELIVERY_PROJECT_VAULT_REPORT';

export const TRACKED_DELIVERY_CATEGORIES: readonly DeliveryCategory[] = [
  'GENERAL_DELIVERY',
  'FOUNDER_ALERT_DELIVERY',
  'PROJECT_DELIVERY',
  'MOBILE_DELIVERY',
  'INBOX_DELIVERY',
  'CLOUD_DELIVERY',
  'WORLD2_DELIVERY',
  'AUTONOMOUS_BUILDER_DELIVERY',
  'AIDEV_DELIVERY',
  'APPROVAL_DELIVERY',
  'PREVIEW_DELIVERY',
  'COMMAND_DELIVERY',
  'CHAT_DELIVERY',
  'SYSTEM_DELIVERY',
] as const;

export const TRACKED_DELIVERY_CHANNELS: readonly DeliveryChannel[] = [
  'IN_APP',
  'FOUNDER_INBOX',
  'MOBILE',
  'EMAIL',
  'SMS',
  'PUSH',
  'OPERATOR_FEED',
  'PROJECT_VAULT',
  'UNKNOWN_CHANNEL',
] as const;

export const TRACKED_DELIVERY_PRIORITIES: readonly DeliveryPriority[] = [
  'CRITICAL',
  'HIGH',
  'NORMAL',
  'LOW',
  'INFORMATIONAL',
] as const;

export const FORBIDDEN_DELIVERY_DUPLICATES = [
  'delivery_executor',
  'delivery_worker',
  'parallel_delivery_authority',
  'push_delivery_service',
  'email_delivery_service',
  'sms_delivery_service',
  'fcm_connector',
  'apns_connector',
] as const;

export const DELIVERY_COMPANION_DOMAINS = [
  'notification_delivery_foundation',
  'founder_inbox_foundation',
  'founder_notification_runtime_foundation',
  'cross_device_runtime_foundation',
  'mobile_approval_runtime_foundation',
  'mobile_command_runtime_foundation',
  'mobile_chat_runtime_foundation',
  'mobile_preview_runtime_foundation',
] as const;

export const NOTIFICATION_DELIVERY_QUESTION_SIGNALS = [
  'notification delivery',
  'notification delivery foundation',
  'notification delivery inventory',
  'delivery planning',
  'delivery routing',
  'delivery targeting',
  'delivery eligibility',
  'delivery channel',
  'delivery intent',
  'delivery policy',
  'delivery block',
  'delivery defer',
  'delivery deferral',
  'delivery visibility',
  'delivery state',
  'delivery lifecycle',
  'delivery history',
  'delivery diagnostics',
  'register delivery',
  'list delivery',
  'plan delivery',
  'route delivery',
  'select delivery target',
  'check channel eligibility',
  'mark delivery ready',
  'mark delivery completed',
  'delivery notification link',
  'delivery inbox link',
  'delivery cross device',
  'delivery cloud link',
  'delivery command link',
  'delivery chat link',
  'delivery preview link',
  'delivery approval link',
  'delivery operator feed',
  'delivery project vault',
  'planning only delivery',
  'no real delivery',
  'no email delivery',
  'no sms delivery',
  'no push delivery',
] as const;

export interface DeliveryOwnership {
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
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

export interface DeliveryVisibility {
  visibleInPlanning: boolean;
  visibleOnMobile: boolean;
  visibleOnDesktop: boolean;
  visibleOnCloud: boolean;
  visibleInOperatorFeed: boolean;
  visibleInProjectVault: boolean;
  visibilityReason: string;
}

export interface DeliveryContext {
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

export interface DeliveryPriorityMeta {
  priority: DeliveryPriority;
  priorityReason: string;
  escalated: boolean;
  escalationReason: string | null;
}

export interface DeliveryIntent {
  intentId: string;
  deliveryId: string;
  intentCategory: DeliveryCategory;
  intentChannel: DeliveryChannel;
  intentReason: string;
  planningOnly: true;
  createdAt: number;
}

export interface DeliveryTarget {
  targetId: string;
  deliveryId: string;
  targetChannel: DeliveryChannel;
  targetDevice: string;
  targetReason: string;
  selectedAt: number;
}

export interface DeliveryRoute {
  routeId: string;
  deliveryId: string;
  sourceRuntime: string;
  targetChannel: DeliveryChannel;
  targetDevice: string;
  routingReason: string;
  routingTimestamp: number;
  routingStatus: 'PLANNED' | 'ROUTED' | 'BLOCKED';
}

export interface DeliveryChannelEligibility {
  eligibilityId: string;
  deliveryId: string;
  channel: DeliveryChannel;
  eligible: boolean;
  eligibilityReason: string;
  checkedAt: number;
}

export interface DeliveryPolicy {
  policyId: string;
  deliveryId: string;
  policyName: string;
  allowedChannels: DeliveryChannel[];
  blockedChannels: DeliveryChannel[];
  policyReason: string;
  appliedAt: number;
}

export interface DeliveryBlockingRecord {
  blockId: string;
  deliveryId: string;
  blockedAt: number;
  blockReason: string;
  blockedBy: string;
  released: boolean;
  releasedAt: number | null;
}

export interface DeliveryDeferralRecord {
  deferralId: string;
  deliveryId: string;
  deferredAt: number;
  deferReason: string;
  deferredUntil: number | null;
  resumed: boolean;
  resumedAt: number | null;
}

export interface DeliveryNotificationLink {
  notificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryInboxLink {
  inboxEntryId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryCrossDeviceLink {
  crossDeviceSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryCommandLink {
  commandSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryChatLink {
  chatSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryPreviewLink {
  previewId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryApprovalLink {
  approvalId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface DeliveryMetadata {
  deliveryName: string;
  deliveryDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface DeliveryProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface NotificationDeliveryRecord {
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  deliveryCategory: DeliveryCategory;
  deliveryState: DeliveryState;
  deliveryStatus: DeliveryStatus;
  deliveryOwnership: DeliveryOwnership;
  deliveryVisibility: DeliveryVisibility;
  deliveryContext: DeliveryContext;
  deliveryPriority: DeliveryPriorityMeta;
  deliveryMetadata: DeliveryMetadata;
  deliveryProvenance: DeliveryProvenance;
  deliveryIntent: DeliveryIntent | null;
  deliveryTarget: DeliveryTarget | null;
  deliveryRoute: DeliveryRoute | null;
  deliveryEligibility: DeliveryChannelEligibility | null;
  deliveryPolicy: DeliveryPolicy | null;
  deliveryBlocking: DeliveryBlockingRecord | null;
  deliveryDeferral: DeliveryDeferralRecord | null;
  deliveryNotificationLink: DeliveryNotificationLink;
  deliveryInboxLink: DeliveryInboxLink;
  deliveryCrossDeviceLink: DeliveryCrossDeviceLink;
  deliveryCloudLink: DeliveryCloudLink;
  deliveryCommandLink: DeliveryCommandLink;
  deliveryChatLink: DeliveryChatLink;
  deliveryPreviewLink: DeliveryPreviewLink;
  deliveryApprovalLink: DeliveryApprovalLink;
  deliveryOperatorFeedLink: DeliveryOperatorFeedLink;
  deliveryProjectVaultLink: DeliveryProjectVaultLink;
  createdAt: number;
  updatedAt: number;
}

export interface DeliveryLifecycleEvent {
  eventId: string;
  deliveryId: string;
  eventType: DeliveryLifecycleEventType;
  previousState: DeliveryState | null;
  newState: DeliveryState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface DeliveryHistoryEntry {
  entryId: string;
  deliveryId: string;
  category:
    | 'DELIVERY'
    | 'OWNERSHIP'
    | 'VISIBILITY'
    | 'PRIORITY'
    | 'STATE'
    | 'INTENT'
    | 'ROUTING'
    | 'TARGETING'
    | 'ELIGIBILITY'
    | 'POLICY'
    | 'BLOCKING'
    | 'DEFERRAL'
    | 'NOTIFICATION'
    | 'INBOX'
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

export interface DeliveryStateHistoryEntry {
  deliveryId: string;
  previousState: DeliveryState | null;
  newState: DeliveryState;
  timestamp: number;
}

export interface DeliveryReport {
  reportId: string;
  reportType: DeliveryReportType;
  generatedAt: number;
  deliveryRecordCount: number;
  lifecycleEventCount: number;
  summary: string;
  findings: string[];
  planningOnly: true;
}

export interface DeliveryDiagnostics {
  deliveryPlanningActive: boolean;
  registeredDeliveryCount: number;
  plannedDeliveryCount: number;
  eligibilityCheckedCount: number;
  routedDeliveryCount: number;
  targetSelectedCount: number;
  blockedDeliveryCount: number;
  deferredDeliveryCount: number;
  readyDeliveryCount: number;
  completedDeliveryCount: number;
  failedDeliveryCount: number;
  archivedDeliveryCount: number;
  duplicateRiskCount: number;
  notificationMismatchCount: number;
  inboxMismatchCount: number;
  crossDeviceMismatchCount: number;
  cloudMismatchCount: number;
  commandMismatchCount: number;
  chatMismatchCount: number;
  previewMismatchCount: number;
  approvalMismatchCount: number;
  lastQuery: string | null;
  lastState: DeliveryState | null;
}

export interface DeliveryValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterDeliveryRecordInput {
  deliveryName: string;
  notificationId: string;
  inboxEntryId: string;
  deliveryCategory?: DeliveryCategory;
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
  deliveryDescription?: string;
  priority?: DeliveryPriority;
  channel?: DeliveryChannel;
  visibility?: DeliveryVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterDeliveryRecordResult {
  record: NotificationDeliveryRecord | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareNotificationDeliveryFoundationInput {
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
  inboxEntryId?: string;
  deliveryName?: string;
  deliveryCategory?: DeliveryCategory;
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
  inboxEntryExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareNotificationDeliveryFoundationResult {
  record: NotificationDeliveryRecord | null;
  reports: DeliveryReport[];
  diagnostics: DeliveryDiagnostics;
  validation: DeliveryValidationResult;
  responseText: string;
  planningOnly: true;
}

export interface DuplicateDeliveryRiskContext {
  deliveryName: string;
  deliveryCategory: DeliveryCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  notificationSummaries: string[];
  inboxSummaries: string[];
  crossDeviceSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
}

export function isNotificationDeliveryFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  if (lower.includes('founder notification') && !lower.includes('notification delivery')) return false;
  if (lower.includes('founder inbox') && !lower.includes('notification delivery')) return false;
  return NOTIFICATION_DELIVERY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateDeliveryExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_DELIVERY_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidDeliveryStateTransition(from: DeliveryState, to: DeliveryState): boolean {
  const allowed: Record<DeliveryState, DeliveryState[]> = {
    CREATED: ['PLANNED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    PLANNED: ['ELIGIBILITY_CHECKED', 'FAILED', 'BLOCKED', 'DEFERRED', 'ARCHIVED'],
    ELIGIBILITY_CHECKED: ['ROUTED', 'FAILED', 'BLOCKED', 'DEFERRED', 'ARCHIVED'],
    ROUTED: ['TARGET_SELECTED', 'FAILED', 'BLOCKED', 'DEFERRED', 'ARCHIVED'],
    TARGET_SELECTED: ['READY', 'FAILED', 'BLOCKED', 'DEFERRED', 'ARCHIVED'],
    BLOCKED: ['PLANNED', 'DEFERRED', 'FAILED', 'ARCHIVED'],
    DEFERRED: ['PLANNED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    READY: ['COMPLETED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['CREATED', 'PLANNED', 'ARCHIVED'],
    ARCHIVED: ['CREATED', 'PLANNED'],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function validateDeliveryState(state: DeliveryState): boolean {
  const valid: DeliveryState[] = [
    'CREATED',
    'PLANNED',
    'ELIGIBILITY_CHECKED',
    'ROUTED',
    'TARGET_SELECTED',
    'BLOCKED',
    'DEFERRED',
    'READY',
    'COMPLETED',
    'FAILED',
    'ARCHIVED',
  ];
  return valid.includes(state);
}

export function resolveDefaultChannelForCategory(category: DeliveryCategory): DeliveryChannel {
  const map: Record<DeliveryCategory, DeliveryChannel> = {
    GENERAL_DELIVERY: 'IN_APP',
    FOUNDER_ALERT_DELIVERY: 'IN_APP',
    PROJECT_DELIVERY: 'OPERATOR_FEED',
    MOBILE_DELIVERY: 'MOBILE',
    INBOX_DELIVERY: 'FOUNDER_INBOX',
    CLOUD_DELIVERY: 'OPERATOR_FEED',
    WORLD2_DELIVERY: 'IN_APP',
    AUTONOMOUS_BUILDER_DELIVERY: 'OPERATOR_FEED',
    AIDEV_DELIVERY: 'IN_APP',
    APPROVAL_DELIVERY: 'IN_APP',
    PREVIEW_DELIVERY: 'IN_APP',
    COMMAND_DELIVERY: 'OPERATOR_FEED',
    CHAT_DELIVERY: 'IN_APP',
    SYSTEM_DELIVERY: 'PROJECT_VAULT',
  };
  return map[category];
}
