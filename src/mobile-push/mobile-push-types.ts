/**
 * DevPulse V2 Phase 18.9 — Mobile Push Foundation types.
 * Push planning, token metadata, payload planning, platform targeting — no real push.
 */

export const MOBILE_PUSH_FOUNDATION_PASS_TOKEN = 'MOBILE_PUSH_FOUNDATION_V1_PASS';
export const MOBILE_PUSH_FOUNDATION_OWNER_MODULE = 'devpulse_v2_mobile_push_foundation';
export const DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK_PREFIX = 'DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK';

export type PushCategory =
  | 'GENERAL_PUSH'
  | 'FOUNDER_ALERT_PUSH'
  | 'PROJECT_PUSH'
  | 'MOBILE_RUNTIME_PUSH'
  | 'CLOUD_PUSH'
  | 'WORLD2_PUSH'
  | 'AUTONOMOUS_BUILDER_PUSH'
  | 'AIDEV_PUSH'
  | 'APPROVAL_PUSH'
  | 'PREVIEW_PUSH'
  | 'COMMAND_PUSH'
  | 'CHAT_PUSH'
  | 'SYSTEM_PUSH';

export type PushPlatform = 'ANDROID' | 'IOS' | 'WEB' | 'UNKNOWN_PLATFORM';

export type TokenState =
  | 'TOKEN_UNKNOWN'
  | 'TOKEN_METADATA_REGISTERED'
  | 'TOKEN_METADATA_VALID'
  | 'TOKEN_METADATA_INVALID'
  | 'TOKEN_METADATA_EXPIRED'
  | 'TOKEN_METADATA_REVOKED';

export type PushState =
  | 'CREATED'
  | 'PLANNED'
  | 'ELIGIBILITY_CHECKED'
  | 'TOKEN_METADATA_CHECKED'
  | 'PAYLOAD_PLANNED'
  | 'ROUTED'
  | 'TARGET_SELECTED'
  | 'BLOCKED'
  | 'DEFERRED'
  | 'READY'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type PushStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type PushLifecycleEventType =
  | 'PUSH_CREATED'
  | 'PUSH_PLANNED'
  | 'PUSH_ELIGIBILITY_CHECKED'
  | 'PUSH_TOKEN_METADATA_CHECKED'
  | 'PUSH_PAYLOAD_PLANNED'
  | 'PUSH_ROUTED'
  | 'PUSH_TARGET_SELECTED'
  | 'PUSH_BLOCKED'
  | 'PUSH_DEFERRED'
  | 'PUSH_READY'
  | 'PUSH_COMPLETED'
  | 'PUSH_FAILED'
  | 'PUSH_ARCHIVED';

export type PushReportType =
  | 'MOBILE_PUSH_INVENTORY_REPORT'
  | 'MOBILE_PUSH_OWNERSHIP_REPORT'
  | 'MOBILE_PUSH_CONTEXT_REPORT'
  | 'MOBILE_PUSH_TOKEN_METADATA_REPORT'
  | 'MOBILE_PUSH_PLATFORM_REPORT'
  | 'MOBILE_PUSH_PAYLOAD_REPORT'
  | 'MOBILE_PUSH_TARGETING_REPORT'
  | 'MOBILE_PUSH_ELIGIBILITY_REPORT'
  | 'MOBILE_PUSH_ROUTING_REPORT'
  | 'MOBILE_PUSH_POLICY_REPORT'
  | 'MOBILE_PUSH_BLOCKING_REPORT'
  | 'MOBILE_PUSH_DEFERRAL_REPORT'
  | 'MOBILE_PUSH_VISIBILITY_REPORT'
  | 'MOBILE_PUSH_STATE_REPORT'
  | 'MOBILE_PUSH_LIFECYCLE_REPORT'
  | 'MOBILE_PUSH_HISTORY_REPORT'
  | 'MOBILE_PUSH_DIAGNOSTICS_REPORT'
  | 'MOBILE_PUSH_DELIVERY_LINK_REPORT'
  | 'MOBILE_PUSH_NOTIFICATION_LINK_REPORT'
  | 'MOBILE_PUSH_INBOX_LINK_REPORT'
  | 'MOBILE_PUSH_CROSS_DEVICE_REPORT'
  | 'MOBILE_PUSH_COMMAND_REPORT'
  | 'MOBILE_PUSH_CHAT_REPORT'
  | 'MOBILE_PUSH_PREVIEW_REPORT'
  | 'MOBILE_PUSH_APPROVAL_REPORT'
  | 'MOBILE_PUSH_CLOUD_REPORT'
  | 'MOBILE_PUSH_OPERATOR_FEED_REPORT'
  | 'MOBILE_PUSH_PROJECT_VAULT_REPORT';

export const TRACKED_PUSH_CATEGORIES: readonly PushCategory[] = [
  'GENERAL_PUSH', 'FOUNDER_ALERT_PUSH', 'PROJECT_PUSH', 'MOBILE_RUNTIME_PUSH', 'CLOUD_PUSH',
  'WORLD2_PUSH', 'AUTONOMOUS_BUILDER_PUSH', 'AIDEV_PUSH', 'APPROVAL_PUSH', 'PREVIEW_PUSH',
  'COMMAND_PUSH', 'CHAT_PUSH', 'SYSTEM_PUSH',
] as const;

export const TRACKED_PUSH_PLATFORMS: readonly PushPlatform[] = [
  'ANDROID', 'IOS', 'WEB', 'UNKNOWN_PLATFORM',
] as const;

export const TRACKED_TOKEN_STATES: readonly TokenState[] = [
  'TOKEN_UNKNOWN', 'TOKEN_METADATA_REGISTERED', 'TOKEN_METADATA_VALID', 'TOKEN_METADATA_INVALID',
  'TOKEN_METADATA_EXPIRED', 'TOKEN_METADATA_REVOKED',
] as const;

export const FORBIDDEN_MOBILE_PUSH_DUPLICATES = [
  'mobile_push_executor', 'mobile_push_worker', 'parallel_mobile_push_authority',
  'fcm_connector', 'apns_connector', 'firebase_push_service', 'apple_push_service', 'raw_push_token_store',
] as const;

export const MOBILE_PUSH_COMPANION_DOMAINS = [
  'mobile_push_foundation', 'notification_delivery_foundation', 'founder_inbox_foundation',
  'founder_notification_runtime_foundation', 'cross_device_runtime_foundation',
  'mobile_approval_runtime_foundation', 'mobile_command_runtime_foundation',
  'mobile_chat_runtime_foundation', 'mobile_preview_runtime_foundation',
] as const;

export const MOBILE_PUSH_QUESTION_SIGNALS = [
  'mobile push', 'mobile push foundation', 'mobile push inventory', 'push planning',
  'push routing', 'push targeting', 'push eligibility', 'push platform', 'push payload',
  'push token metadata', 'token metadata', 'push policy', 'push block', 'push defer',
  'push deferral', 'push visibility', 'push state', 'push lifecycle', 'push history',
  'push diagnostics', 'register push', 'list push', 'plan push', 'route push',
  'select push target', 'check push eligibility', 'check token metadata', 'plan push payload',
  'mark push ready', 'mark push completed', 'push delivery link', 'push notification link',
  'push inbox link', 'push cross device', 'planning only push', 'no real push', 'no fcm', 'no apns',
] as const;

export const RAW_TOKEN_RISK_PATTERNS = [
  /^[a-zA-Z0-9_-]{100,}$/,
  /fcm:/i, /apns:/i, /ExponentPushToken/i, /device_token/i, /raw.?token/i,
] as const;

export interface PushOwnership {
  pushId: string;
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

export interface PushVisibility {
  visibleInPlanning: boolean;
  visibleOnMobile: boolean;
  visibleOnDesktop: boolean;
  visibleOnCloud: boolean;
  visibleInOperatorFeed: boolean;
  visibleInProjectVault: boolean;
  visibilityReason: string;
}

export interface PushContext {
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

export interface PushTokenMetadata {
  tokenId: string;
  pushId: string;
  tokenAlias: string;
  tokenFingerprint: string;
  tokenState: TokenState;
  platform: PushPlatform;
  registeredAt: number;
  planningOnly: true;
}

export interface PushPlatformMeta {
  platformId: string;
  pushId: string;
  platform: PushPlatform;
  platformReason: string;
  selectedAt: number;
}

export interface PushPayload {
  payloadId: string;
  pushId: string;
  title: string;
  body: string;
  category: PushCategory;
  planningOnly: true;
  plannedAt: number;
}

export interface PushDeviceTarget {
  targetId: string;
  pushId: string;
  targetPlatform: PushPlatform;
  targetDevice: string;
  targetReason: string;
  selectedAt: number;
}

export interface PushRoute {
  routeId: string;
  pushId: string;
  sourceRuntime: string;
  targetPlatform: PushPlatform;
  targetDevice: string;
  routingReason: string;
  routingTimestamp: number;
  routingStatus: 'PLANNED' | 'ROUTED' | 'BLOCKED';
}

export interface PushEligibility {
  eligibilityId: string;
  pushId: string;
  platform: PushPlatform;
  eligible: boolean;
  eligibilityReason: string;
  checkedAt: number;
}

export interface PushPolicy {
  policyId: string;
  pushId: string;
  policyName: string;
  allowedPlatforms: PushPlatform[];
  blockedPlatforms: PushPlatform[];
  policyReason: string;
  appliedAt: number;
}

export interface PushBlockingRecord {
  blockId: string;
  pushId: string;
  blockedAt: number;
  blockReason: string;
  blockedBy: string;
  released: boolean;
  releasedAt: number | null;
}

export interface PushDeferralRecord {
  deferralId: string;
  pushId: string;
  deferredAt: number;
  deferReason: string;
  deferredUntil: number | null;
  resumed: boolean;
  resumedAt: number | null;
}

export interface PushDeliveryLink {
  deliveryId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushNotificationLink {
  notificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushInboxLink {
  inboxEntryId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushCrossDeviceLink {
  crossDeviceSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushCommandLink {
  commandSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushChatLink {
  chatSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushPreviewLink {
  previewId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushApprovalLink {
  approvalId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PushMetadata {
  pushName: string;
  pushDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface PushProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface MobilePushRecord {
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  pushCategory: PushCategory;
  pushState: PushState;
  pushStatus: PushStatus;
  pushOwnership: PushOwnership;
  pushVisibility: PushVisibility;
  pushContext: PushContext;
  pushMetadata: PushMetadata;
  pushProvenance: PushProvenance;
  pushTokenMetadata: PushTokenMetadata | null;
  pushPlatform: PushPlatformMeta | null;
  pushPayload: PushPayload | null;
  pushDeviceTarget: PushDeviceTarget | null;
  pushRoute: PushRoute | null;
  pushEligibility: PushEligibility | null;
  pushPolicy: PushPolicy | null;
  pushBlocking: PushBlockingRecord | null;
  pushDeferral: PushDeferralRecord | null;
  pushDeliveryLink: PushDeliveryLink;
  pushNotificationLink: PushNotificationLink;
  pushInboxLink: PushInboxLink;
  pushCrossDeviceLink: PushCrossDeviceLink;
  pushCloudLink: PushCloudLink;
  pushCommandLink: PushCommandLink;
  pushChatLink: PushChatLink;
  pushPreviewLink: PushPreviewLink;
  pushApprovalLink: PushApprovalLink;
  pushOperatorFeedLink: PushOperatorFeedLink;
  pushProjectVaultLink: PushProjectVaultLink;
  createdAt: number;
  updatedAt: number;
}

export interface PushLifecycleEvent {
  eventId: string;
  pushId: string;
  eventType: PushLifecycleEventType;
  previousState: PushState | null;
  newState: PushState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface PushHistoryEntry {
  entryId: string;
  pushId: string;
  category:
    | 'PUSH' | 'OWNERSHIP' | 'VISIBILITY' | 'STATE' | 'TOKEN' | 'PLATFORM' | 'PAYLOAD'
    | 'ROUTING' | 'TARGETING' | 'ELIGIBILITY' | 'POLICY' | 'BLOCKING' | 'DEFERRAL'
    | 'DELIVERY' | 'NOTIFICATION' | 'INBOX' | 'CROSS_DEVICE' | 'CLOUD' | 'COMMAND'
    | 'CHAT' | 'PREVIEW' | 'APPROVAL' | 'OPERATOR_FEED' | 'PROJECT_VAULT' | 'CONTEXT' | 'LIFECYCLE';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface PushStateHistoryEntry {
  pushId: string;
  previousState: PushState | null;
  newState: PushState;
  timestamp: number;
}

export interface PushReport {
  reportId: string;
  reportType: PushReportType;
  generatedAt: number;
  pushRecordCount: number;
  lifecycleEventCount: number;
  summary: string;
  findings: string[];
  planningOnly: true;
}

export interface PushDiagnostics {
  pushPlanningActive: boolean;
  registeredPushCount: number;
  plannedPushCount: number;
  eligibilityCheckedCount: number;
  tokenMetadataCheckedCount: number;
  payloadPlannedCount: number;
  routedPushCount: number;
  targetSelectedCount: number;
  blockedPushCount: number;
  deferredPushCount: number;
  readyPushCount: number;
  completedPushCount: number;
  failedPushCount: number;
  archivedPushCount: number;
  duplicateRiskCount: number;
  rawTokenRiskCount: number;
  deliveryMismatchCount: number;
  notificationMismatchCount: number;
  inboxMismatchCount: number;
  crossDeviceMismatchCount: number;
  cloudMismatchCount: number;
  commandMismatchCount: number;
  chatMismatchCount: number;
  previewMismatchCount: number;
  approvalMismatchCount: number;
  lastQuery: string | null;
  lastState: PushState | null;
}

export interface PushValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
  rawTokenRisks: string[];
}

export interface RegisterPushRecordInput {
  pushName: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  pushCategory?: PushCategory;
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
  pushDescription?: string;
  platform?: PushPlatform;
  tokenAlias?: string;
  tokenFingerprint?: string;
  visibility?: PushVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterPushRecordResult {
  record: MobilePushRecord | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareMobilePushFoundationInput {
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
  deliveryId?: string;
  notificationId?: string;
  inboxEntryId?: string;
  pushName?: string;
  pushCategory?: PushCategory;
  projectExists?: boolean;
  commandSessionExists?: boolean;
  chatSessionExists?: boolean;
  previewSessionExists?: boolean;
  approvalSessionExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  crossDeviceSessionExists?: boolean;
  deliveryExists?: boolean;
  notificationExists?: boolean;
  inboxEntryExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareMobilePushFoundationResult {
  record: MobilePushRecord | null;
  reports: PushReport[];
  diagnostics: PushDiagnostics;
  validation: PushValidationResult;
  responseText: string;
  planningOnly: true;
}

export interface DuplicateMobilePushRiskContext {
  pushName: string;
  pushCategory: PushCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  deliverySummaries: string[];
  notificationSummaries: string[];
  inboxSummaries: string[];
  crossDeviceSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
}

export function isMobilePushFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  if (lower.includes('notification delivery') && !lower.includes('mobile push')) return false;
  if (lower.includes('founder notification') && !lower.includes('mobile push')) return false;
  if (lower.includes('founder inbox') && !lower.includes('mobile push')) return false;
  return MOBILE_PUSH_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateMobilePushExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_MOBILE_PUSH_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidPushStateTransition(from: PushState, to: PushState): boolean {
  const allowed: Record<PushState, PushState[]> = {
    CREATED: ['PLANNED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    PLANNED: ['ELIGIBILITY_CHECKED', 'FAILED', 'BLOCKED', 'DEFERRED', 'ARCHIVED'],
    ELIGIBILITY_CHECKED: ['TOKEN_METADATA_CHECKED', 'FAILED', 'BLOCKED', 'DEFERRED', 'ARCHIVED'],
    TOKEN_METADATA_CHECKED: ['PAYLOAD_PLANNED', 'FAILED', 'BLOCKED', 'DEFERRED', 'ARCHIVED'],
    PAYLOAD_PLANNED: ['ROUTED', 'FAILED', 'BLOCKED', 'DEFERRED', 'ARCHIVED'],
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

export function validatePushState(state: PushState): boolean {
  const valid: PushState[] = [
    'CREATED', 'PLANNED', 'ELIGIBILITY_CHECKED', 'TOKEN_METADATA_CHECKED', 'PAYLOAD_PLANNED',
    'ROUTED', 'TARGET_SELECTED', 'BLOCKED', 'DEFERRED', 'READY', 'COMPLETED', 'FAILED', 'ARCHIVED',
  ];
  return valid.includes(state);
}

export function resolveDefaultPlatformForCategory(category: PushCategory): PushPlatform {
  const map: Record<PushCategory, PushPlatform> = {
    GENERAL_PUSH: 'ANDROID',
    FOUNDER_ALERT_PUSH: 'IOS',
    PROJECT_PUSH: 'ANDROID',
    MOBILE_RUNTIME_PUSH: 'ANDROID',
    CLOUD_PUSH: 'WEB',
    WORLD2_PUSH: 'ANDROID',
    AUTONOMOUS_BUILDER_PUSH: 'ANDROID',
    AIDEV_PUSH: 'WEB',
    APPROVAL_PUSH: 'IOS',
    PREVIEW_PUSH: 'ANDROID',
    COMMAND_PUSH: 'ANDROID',
    CHAT_PUSH: 'IOS',
    SYSTEM_PUSH: 'UNKNOWN_PLATFORM',
  };
  return map[category];
}

export function detectRawTokenRisk(value: string): boolean {
  if (!value?.trim()) return false;
  if (value.length > 80 && !value.includes('fingerprint') && !value.includes('alias')) return true;
  return RAW_TOKEN_RISK_PATTERNS.some((p) => p.test(value));
}
