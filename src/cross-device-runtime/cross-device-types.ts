/**
 * DevPulse V2 Phase 18.5 — Cross Device Runtime Foundation types.
 * Cross-device authority only — no real sync, connections, or device pairing.
 */

export const CROSS_DEVICE_RUNTIME_FOUNDATION_PASS_TOKEN = 'CROSS_DEVICE_RUNTIME_FOUNDATION_V1_PASS';
export const CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE = 'devpulse_v2_cross_device_runtime_foundation';
export const DUPLICATE_CROSS_DEVICE_RISK_PREFIX = 'DUPLICATE_CROSS_DEVICE_RISK';

export type CrossDeviceCategory =
  | 'GENERAL_CROSS_DEVICE'
  | 'MOBILE_TO_DESKTOP'
  | 'DESKTOP_TO_MOBILE'
  | 'MOBILE_TO_CLOUD'
  | 'DESKTOP_TO_CLOUD'
  | 'WORLD2_CROSS_DEVICE'
  | 'AIDEV_CROSS_DEVICE'
  | 'AUTONOMOUS_CROSS_DEVICE'
  | 'FOUNDER_CROSS_DEVICE';

export type CrossDeviceType =
  | 'MOBILE'
  | 'DESKTOP'
  | 'TABLET'
  | 'BROWSER'
  | 'CLOUD_RUNTIME'
  | 'UNKNOWN_DEVICE';

export type CrossDeviceState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_LINKED'
  | 'HANDOFF_AVAILABLE'
  | 'HANDOFF_REQUESTED'
  | 'HANDOFF_READY'
  | 'HANDOFF_COMPLETED'
  | 'VISIBILITY_UPDATED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type CrossDeviceStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type CrossDeviceLifecycleEventType =
  | 'CROSS_DEVICE_CREATED'
  | 'CROSS_DEVICE_INITIALIZED'
  | 'CROSS_DEVICE_READY'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_LINKED'
  | 'HANDOFF_AVAILABLE'
  | 'HANDOFF_REQUESTED'
  | 'HANDOFF_READY'
  | 'HANDOFF_COMPLETED'
  | 'VISIBILITY_UPDATED'
  | 'CROSS_DEVICE_COMPLETED'
  | 'CROSS_DEVICE_ARCHIVED'
  | 'CROSS_DEVICE_FAILED';

export type CrossDeviceReportType =
  | 'CROSS_DEVICE_INVENTORY_REPORT'
  | 'CROSS_DEVICE_OWNERSHIP_REPORT'
  | 'CROSS_DEVICE_LIFECYCLE_REPORT'
  | 'CROSS_DEVICE_STATE_REPORT'
  | 'CROSS_DEVICE_CONTEXT_REPORT'
  | 'DEVICE_REGISTRATION_REPORT'
  | 'DEVICE_LINK_REPORT'
  | 'DEVICE_HANDOFF_REPORT'
  | 'DEVICE_VISIBILITY_REPORT'
  | 'CROSS_DEVICE_COMMAND_LINK_REPORT'
  | 'CROSS_DEVICE_CHAT_LINK_REPORT'
  | 'CROSS_DEVICE_PREVIEW_LINK_REPORT'
  | 'CROSS_DEVICE_APPROVAL_LINK_REPORT'
  | 'CROSS_DEVICE_CLOUD_LINK_REPORT'
  | 'CROSS_DEVICE_WORKSPACE_LINK_REPORT'
  | 'CROSS_DEVICE_BUILD_LINK_REPORT'
  | 'CROSS_DEVICE_OPERATOR_FEED_REPORT'
  | 'CROSS_DEVICE_PROJECT_VAULT_REPORT'
  | 'CROSS_DEVICE_HISTORY_REPORT'
  | 'CROSS_DEVICE_DIAGNOSTICS_REPORT';

export const TRACKED_CROSS_DEVICE_CATEGORIES: readonly CrossDeviceCategory[] = [
  'GENERAL_CROSS_DEVICE',
  'MOBILE_TO_DESKTOP',
  'DESKTOP_TO_MOBILE',
  'MOBILE_TO_CLOUD',
  'DESKTOP_TO_CLOUD',
  'WORLD2_CROSS_DEVICE',
  'AIDEV_CROSS_DEVICE',
  'AUTONOMOUS_CROSS_DEVICE',
  'FOUNDER_CROSS_DEVICE',
] as const;

export const FORBIDDEN_CROSS_DEVICE_DUPLICATES = [
  'cross_device_executor',
  'cross_device_worker',
  'parallel_cross_device_authority',
  'cross_device_sync_engine',
  'cross_device_notifier',
] as const;

export const CROSS_DEVICE_COMPANION_DOMAINS = [
  'cross_device_runtime_foundation',
  'mobile_approval_runtime_foundation',
  'mobile_command_runtime_foundation',
  'mobile_chat_runtime_foundation',
  'mobile_preview_runtime_foundation',
] as const;

export const CROSS_DEVICE_QUESTION_SIGNALS = [
  'cross device',
  'cross device session',
  'cross device runtime',
  'cross device inventory',
  'cross device foundation',
  'device registered',
  'device linked',
  'device handoff',
  'handoff available',
  'handoff requested',
  'handoff ready',
  'handoff completed',
  'device visibility',
  'mobile to desktop',
  'desktop to mobile',
  'mobile to cloud',
  'desktop to cloud',
  'register cross device',
  'list cross devices',
  'cross device state',
  'cross device context',
  'cross device history',
  'cross device diagnostics',
  'cross device command link',
  'cross device chat link',
  'cross device preview link',
  'cross device approval link',
  'cross device cloud link',
  'cross device workspace link',
  'cross device build link',
  'cross device operator feed',
  'cross device project vault',
  'authority only cross device',
  'no real sync',
  'no device pairing',
] as const;

export interface CrossDeviceOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  deviceId: string;
  deviceSessionId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  mobileApprovalSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  crossDeviceAuthority: string;
  creationTimestamp: number;
}

export interface DeviceVisibility {
  visibleOnMobile: boolean;
  visibleOnDesktop: boolean;
  visibleOnCloud: boolean;
  visibleInOperatorFeed: boolean;
  visibleInProjectVault: boolean;
  visibleInMobileCommand: boolean;
  visibilityReason: string;
}

export interface DeviceRecord {
  deviceRecordId: string;
  crossDeviceId: string;
  deviceId: string;
  deviceType: CrossDeviceType;
  deviceSessionId: string;
  projectId: string;
  registeredAt: number;
  registeredBy: string;
  metadataOnly: true;
}

export interface DeviceLink {
  deviceLinkId: string;
  crossDeviceId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  sourceDeviceType: CrossDeviceType;
  targetDeviceType: CrossDeviceType;
  projectId: string;
  sessionId: string;
  linkStatus: 'PENDING' | 'LINKED' | 'MISMATCH' | 'BLOCKED';
  linkTimestamp: number;
  linkVisibility: DeviceVisibility;
}

export interface DeviceHandoff {
  handoffId: string;
  crossDeviceId: string;
  handoffType: CrossDeviceCategory;
  sourceDeviceId: string;
  targetDeviceId: string;
  projectId: string;
  handoffContext: string;
  handoffStatus: 'AVAILABLE' | 'REQUESTED' | 'READY' | 'COMPLETED' | 'BLOCKED';
  handoffReason: string;
  handoffTimestamp: number;
  handoffAllowed: boolean;
  handoffBlockedReason: string | null;
}

export interface CrossDeviceContext {
  contextSummary: string;
  commandSessionSummary: string | null;
  chatSessionSummary: string | null;
  previewSessionSummary: string | null;
  approvalSessionSummary: string | null;
  runtimeSummary: string | null;
  workspaceSummary: string | null;
  persistentBuildSummary: string | null;
  operatorFeedSummary: string | null;
  projectVaultSummary: string | null;
  deviceSummaries: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  knownConstraints: string[];
}

export interface CrossDeviceCommandLink {
  mobileCommandId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CrossDeviceChatLink {
  mobileChatId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CrossDevicePreviewLink {
  mobilePreviewId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CrossDeviceApprovalLink {
  mobileApprovalId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CrossDeviceCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CrossDeviceWorkspaceLink {
  workspaceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CrossDeviceBuildLink {
  persistentBuildId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CrossDeviceOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CrossDeviceProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CrossDeviceMetadata {
  crossDeviceName: string;
  crossDeviceDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface CrossDeviceProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface CrossDeviceSession {
  crossDeviceId: string;
  crossDeviceType: CrossDeviceCategory;
  crossDeviceOwner: CrossDeviceOwnership;
  crossDeviceState: CrossDeviceState;
  crossDeviceStatus: CrossDeviceStatus;
  crossDeviceMetadata: CrossDeviceMetadata;
  crossDeviceVisibility: DeviceVisibility;
  crossDeviceProvenance: CrossDeviceProvenance;
  crossDeviceContext: CrossDeviceContext;
  deviceRecords: DeviceRecord[];
  deviceLinks: DeviceLink[];
  deviceHandoffs: DeviceHandoff[];
  crossDeviceCommandLink: CrossDeviceCommandLink;
  crossDeviceChatLink: CrossDeviceChatLink;
  crossDevicePreviewLink: CrossDevicePreviewLink;
  crossDeviceApprovalLink: CrossDeviceApprovalLink;
  crossDeviceCloudLink: CrossDeviceCloudLink;
  crossDeviceWorkspaceLink: CrossDeviceWorkspaceLink;
  crossDeviceBuildLink: CrossDeviceBuildLink;
  crossDeviceOperatorFeedLink: CrossDeviceOperatorFeedLink;
  crossDeviceProjectVaultLink: CrossDeviceProjectVaultLink;
  createdAt: number;
  updatedAt: number;
}

export interface CrossDeviceTrackedSession {
  sessionId: string;
  crossDeviceId: string;
  projectId: string;
  deviceId: string;
  deviceSessionId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  mobileApprovalSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  sessionOwner: string;
  sessionState: CrossDeviceState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: DeviceVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface CrossDeviceLifecycleEvent {
  eventId: string;
  crossDeviceId: string;
  eventType: CrossDeviceLifecycleEventType;
  previousState: CrossDeviceState | null;
  newState: CrossDeviceState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface CrossDeviceHistoryEntry {
  entryId: string;
  crossDeviceId: string;
  category:
    | 'CROSS_DEVICE'
    | 'DEVICE'
    | 'LINK'
    | 'HANDOFF'
    | 'VISIBILITY'
    | 'STATE'
    | 'OWNERSHIP'
    | 'COMMAND'
    | 'CHAT'
    | 'PREVIEW'
    | 'APPROVAL'
    | 'RUNTIME'
    | 'WORKSPACE'
    | 'PERSISTENT_BUILD'
    | 'OPERATOR_FEED'
    | 'PROJECT_VAULT'
    | 'CONTEXT'
    | 'LIFECYCLE'
    | 'SESSION';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface CrossDeviceStateHistoryEntry {
  crossDeviceId: string;
  previousState: CrossDeviceState | null;
  newState: CrossDeviceState;
  timestamp: number;
}

export interface CrossDeviceReport {
  reportId: string;
  reportType: CrossDeviceReportType;
  generatedAt: number;
  crossDeviceCount: number;
  deviceRecordCount: number;
  deviceLinkCount: number;
  deviceHandoffCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface CrossDeviceDiagnostics {
  crossDeviceAuthorityActive: boolean;
  registeredCrossDeviceCount: number;
  registeredDeviceRecordCount: number;
  registeredDeviceLinkCount: number;
  registeredDeviceHandoffCount: number;
  activeSessionCount: number;
  deviceRegisteredCount: number;
  deviceLinkedCount: number;
  handoffAvailableCount: number;
  handoffRequestedCount: number;
  handoffReadyCount: number;
  handoffCompletedCount: number;
  visibilityUpdatedCount: number;
  duplicateRiskCount: number;
  commandMismatchCount: number;
  chatMismatchCount: number;
  previewMismatchCount: number;
  approvalMismatchCount: number;
  runtimeMismatchCount: number;
  workspaceMismatchCount: number;
  buildMismatchCount: number;
  lastQuery: string | null;
  lastState: CrossDeviceState | null;
}

export interface CrossDeviceValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterCrossDeviceInput {
  crossDeviceName: string;
  crossDeviceType?: CrossDeviceCategory;
  projectId: string;
  deviceId: string;
  deviceSessionId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  mobileApprovalSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  crossDeviceDescription?: string;
  createdBy?: string;
  visibility?: DeviceVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterCrossDeviceResult {
  session: CrossDeviceSession | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareCrossDeviceRuntimeFoundationInput {
  query?: string;
  projectId: string;
  deviceId: string;
  deviceSessionId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  mobileApprovalSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  crossDeviceName?: string;
  crossDeviceType?: CrossDeviceCategory;
  projectExists?: boolean;
  commandSessionExists?: boolean;
  chatSessionExists?: boolean;
  previewSessionExists?: boolean;
  approvalSessionExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareCrossDeviceRuntimeFoundationResult {
  session: CrossDeviceSession | null;
  trackedSession: CrossDeviceTrackedSession | null;
  reports: CrossDeviceReport[];
  diagnostics: CrossDeviceDiagnostics;
  validation: CrossDeviceValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateCrossDeviceRiskContext {
  crossDeviceName: string;
  crossDeviceType: CrossDeviceCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  mobileCommandSummaries: string[];
  mobileChatSummaries: string[];
  mobilePreviewSummaries: string[];
  mobileApprovalSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
}

export function isCrossDeviceRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return CROSS_DEVICE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateCrossDeviceExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_CROSS_DEVICE_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidCrossDeviceStateTransition(from: CrossDeviceState, to: CrossDeviceState): boolean {
  const allowed: Record<CrossDeviceState, CrossDeviceState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['DEVICE_REGISTERED', 'FAILED', 'ARCHIVED'],
    DEVICE_REGISTERED: ['DEVICE_LINKED', 'FAILED', 'ARCHIVED'],
    DEVICE_LINKED: ['HANDOFF_AVAILABLE', 'FAILED', 'ARCHIVED'],
    HANDOFF_AVAILABLE: ['HANDOFF_REQUESTED', 'FAILED', 'ARCHIVED'],
    HANDOFF_REQUESTED: ['HANDOFF_READY', 'FAILED', 'ARCHIVED'],
    HANDOFF_READY: ['HANDOFF_COMPLETED', 'FAILED', 'ARCHIVED'],
    HANDOFF_COMPLETED: ['VISIBILITY_UPDATED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    VISIBILITY_UPDATED: ['COMPLETED', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'READY', 'DEVICE_REGISTERED'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function validateCrossDeviceState(state: CrossDeviceState): boolean {
  const valid: CrossDeviceState[] = [
    'CREATED',
    'INITIALIZING',
    'READY',
    'DEVICE_REGISTERED',
    'DEVICE_LINKED',
    'HANDOFF_AVAILABLE',
    'HANDOFF_REQUESTED',
    'HANDOFF_READY',
    'HANDOFF_COMPLETED',
    'VISIBILITY_UPDATED',
    'COMPLETED',
    'FAILED',
    'ARCHIVED',
  ];
  return valid.includes(state);
}
