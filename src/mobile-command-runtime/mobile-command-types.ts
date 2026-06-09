/**
 * DevPulse V2 Phase 18.1 — Mobile Command Runtime Foundation types.
 * Mobile command authority only — no mobile UI, push notifications, or cloud execution.
 */

export const MOBILE_COMMAND_RUNTIME_FOUNDATION_PASS_TOKEN = 'MOBILE_COMMAND_RUNTIME_FOUNDATION_V1_PASS';
export const MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE = 'devpulse_v2_mobile_command_runtime_foundation';
export const DUPLICATE_MOBILE_COMMAND_RISK_PREFIX = 'DUPLICATE_MOBILE_COMMAND_RISK';

export type MobileCommandCategory =
  | 'GENERAL_MOBILE_COMMAND'
  | 'PROJECT_MOBILE_COMMAND'
  | 'WORLD2_MOBILE_COMMAND'
  | 'AIDEV_MOBILE_COMMAND'
  | 'AUTONOMOUS_MOBILE_COMMAND'
  | 'FOUNDER_MOBILE_COMMAND'
  | 'VERIFICATION_MOBILE_COMMAND'
  | 'RECOVERY_MOBILE_COMMAND'
  | 'MONITORING_MOBILE_COMMAND';

export type MobileCommandState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'CONNECTED_TO_CLOUD'
  | 'CONNECTED_TO_WORKSPACE'
  | 'CONNECTED_TO_BUILD'
  | 'CONNECTED_TO_VERIFICATION'
  | 'CONNECTED_TO_RECOVERY'
  | 'CONNECTED_TO_MONITORING'
  | 'WAITING_FOR_APPROVAL'
  | 'ACTION_BLOCKED'
  | 'ACTION_ALLOWED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type MobileCommandStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type MobileCommandVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'FOUNDER';

export type MobileActionGateResult = 'ALLOW' | 'BLOCK' | 'REQUIRES_APPROVAL' | 'DESKTOP_RECOMMENDED' | 'FOUNDER_ONLY';

export type MobileCommandLifecycleEventType =
  | 'MOBILE_COMMAND_CREATED'
  | 'MOBILE_COMMAND_INITIALIZED'
  | 'MOBILE_COMMAND_CONNECTED_TO_CLOUD'
  | 'MOBILE_COMMAND_CONNECTED_TO_WORKSPACE'
  | 'MOBILE_COMMAND_CONNECTED_TO_BUILD'
  | 'MOBILE_COMMAND_CONNECTED_TO_VERIFICATION'
  | 'MOBILE_COMMAND_CONNECTED_TO_RECOVERY'
  | 'MOBILE_COMMAND_CONNECTED_TO_MONITORING'
  | 'MOBILE_COMMAND_WAITING_FOR_APPROVAL'
  | 'MOBILE_COMMAND_ACTION_BLOCKED'
  | 'MOBILE_COMMAND_ACTION_ALLOWED'
  | 'MOBILE_COMMAND_COMPLETED'
  | 'MOBILE_COMMAND_ARCHIVED'
  | 'MOBILE_COMMAND_FAILED';

export type MobileCommandReportType =
  | 'MOBILE_COMMAND_INVENTORY_REPORT'
  | 'MOBILE_COMMAND_OWNERSHIP_REPORT'
  | 'MOBILE_COMMAND_LIFECYCLE_REPORT'
  | 'MOBILE_COMMAND_STATE_REPORT'
  | 'MOBILE_COMMAND_CONTEXT_REPORT'
  | 'MOBILE_COMMAND_PERMISSIONS_REPORT'
  | 'MOBILE_COMMAND_ACTION_GATE_REPORT'
  | 'MOBILE_COMMAND_CLOUD_LINK_REPORT'
  | 'MOBILE_COMMAND_WORKSPACE_LINK_REPORT'
  | 'MOBILE_COMMAND_BUILD_LINK_REPORT'
  | 'MOBILE_COMMAND_VERIFICATION_LINK_REPORT'
  | 'MOBILE_COMMAND_RECOVERY_LINK_REPORT'
  | 'MOBILE_COMMAND_MONITORING_LINK_REPORT'
  | 'MOBILE_COMMAND_OPERATOR_FEED_REPORT'
  | 'MOBILE_COMMAND_PROJECT_VAULT_REPORT'
  | 'MOBILE_COMMAND_HISTORY_REPORT'
  | 'MOBILE_COMMAND_DIAGNOSTICS_REPORT';

export const TRACKED_MOBILE_COMMAND_CATEGORIES: readonly MobileCommandCategory[] = [
  'GENERAL_MOBILE_COMMAND',
  'PROJECT_MOBILE_COMMAND',
  'WORLD2_MOBILE_COMMAND',
  'AIDEV_MOBILE_COMMAND',
  'AUTONOMOUS_MOBILE_COMMAND',
  'FOUNDER_MOBILE_COMMAND',
  'VERIFICATION_MOBILE_COMMAND',
  'RECOVERY_MOBILE_COMMAND',
  'MONITORING_MOBILE_COMMAND',
] as const;

export const FORBIDDEN_MOBILE_COMMAND_DUPLICATES = [
  'mobile_command_executor',
  'mobile_command_worker',
  'mobile_command_monolith',
  'parallel_mobile_command_authority',
  'parallel_mobile_chat_runtime_authority',
  'mobile_app_builder',
] as const;

/** Official Phase 18.2 companion — chat authority complements command authority. */
export const MOBILE_COMMAND_COMPANION_DOMAINS = [
  'mobile_command_runtime_foundation',
  'mobile_chat_runtime_foundation',
  'mobile_preview_runtime_foundation',
] as const;

export const MOBILE_COMMAND_QUESTION_SIGNALS = [
  'mobile command',
  'mobile command session',
  'mobile command runtime',
  'mobile command state',
  'mobile command context',
  'mobile command permissions',
  'mobile action gate',
  'mobile cloud link',
  'mobile workspace link',
  'mobile build link',
  'mobile verification link',
  'mobile recovery link',
  'mobile monitoring link',
  'mobile operator feed',
  'mobile project vault',
  'mobile command foundation',
  'mobile command inventory',
  'register mobile command',
  'list mobile commands',
  'mobile command diagnostics',
  'mobile command history',
  'mobile command lifecycle',
  'action allowed from mobile',
  'action blocked from mobile',
  'requires approval',
  'desktop recommended',
  'founder only action',
  'connected to cloud',
  'mobile preview allowed',
  'mobile preview blocked',
] as const;

export interface MobileCommandOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringId: string;
  mobileCommandSessionId: string | null;
  mobileCommandAuthority: string;
  creationTimestamp: number;
}

export interface MobileCommandProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface MobileCommandPermissions {
  allowedMobileActions: string[];
  blockedMobileActions: string[];
  requiresApprovalActions: string[];
  desktopOnlyActions: string[];
  cloudAllowedActions: string[];
  mobilePreviewAllowed: boolean;
  mobilePreviewBlockedReason: string | null;
  largeSystemDesktopRecommended: boolean;
  founderOnlyActions: string[];
}

export interface MobileCommandActionGateEntry {
  gateId: string;
  mobileCommandId: string;
  actionName: string;
  result: MobileActionGateResult;
  reason: string;
  evaluatedAt: number;
}

export interface MobileCommandContext {
  contextSummary: string;
  runtimeSummary: string | null;
  workspaceSummary: string | null;
  persistentBuildSummary: string | null;
  verificationSummary: string | null;
  recoverySummary: string | null;
  monitoringSummary: string | null;
  operatorFeedSummary: string | null;
  projectVaultSummary: string | null;
  world2Summary: string | null;
  aidevSummary: string | null;
  vaultSummaries: string[];
  brainSummaries: string[];
  knownConstraints: string[];
}

export interface MobileCommandCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileCommandWorkspaceLink {
  workspaceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileCommandBuildLink {
  persistentBuildId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileCommandVerificationLink {
  verificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileCommandRecoveryLink {
  recoveryId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileCommandMonitoringLink {
  monitoringId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileCommandOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileCommandProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileCommandRelationships {
  parentMobileCommandId: string | null;
  childMobileCommandIds: string[];
  relatedRuntimeIds: string[];
  relatedWorkspaceIds: string[];
  relatedPersistentBuildIds: string[];
  relatedVerificationIds: string[];
  relatedRecoveryIds: string[];
  relatedMonitoringIds: string[];
  relatedProjectIds: string[];
}

export interface MobileCommandMetadata {
  commandName: string;
  commandDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface MobileCommandSession {
  mobileCommandId: string;
  mobileCommandType: MobileCommandCategory;
  mobileCommandOwner: MobileCommandOwnership;
  mobileCommandState: MobileCommandState;
  mobileCommandStatus: MobileCommandStatus;
  mobileCommandMetadata: MobileCommandMetadata;
  mobileCommandVisibility: MobileCommandVisibility;
  mobileCommandProvenance: MobileCommandProvenance;
  mobileCommandContext: MobileCommandContext;
  mobileCommandPermissions: MobileCommandPermissions;
  mobileCommandActionGateResults: MobileCommandActionGateEntry[];
  mobileCommandCloudLink: MobileCommandCloudLink;
  mobileCommandWorkspaceLink: MobileCommandWorkspaceLink;
  mobileCommandBuildLink: MobileCommandBuildLink;
  mobileCommandVerificationLink: MobileCommandVerificationLink;
  mobileCommandRecoveryLink: MobileCommandRecoveryLink;
  mobileCommandMonitoringLink: MobileCommandMonitoringLink;
  mobileCommandOperatorFeedLink: MobileCommandOperatorFeedLink;
  mobileCommandProjectVaultLink: MobileCommandProjectVaultLink;
  mobileCommandRelationships: MobileCommandRelationships;
  createdAt: number;
  updatedAt: number;
}

export interface MobileCommandTrackedSession {
  sessionId: string;
  mobileCommandId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringId: string;
  sessionOwner: string;
  sessionState: MobileCommandState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: MobileCommandVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface MobileCommandLifecycleEvent {
  eventId: string;
  mobileCommandId: string;
  eventType: MobileCommandLifecycleEventType;
  previousState: MobileCommandState | null;
  newState: MobileCommandState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface MobileCommandHistoryEntry {
  entryId: string;
  mobileCommandId: string;
  category:
    | 'MOBILE_COMMAND'
    | 'STATE'
    | 'OWNERSHIP'
    | 'RUNTIME'
    | 'WORKSPACE'
    | 'PERSISTENT_BUILD'
    | 'VERIFICATION'
    | 'RECOVERY'
    | 'MONITORING'
    | 'PERMISSION'
    | 'ACTION_GATE'
    | 'OPERATOR_FEED'
    | 'PROJECT_VAULT'
    | 'PROJECT'
    | 'CONTEXT'
    | 'LIFECYCLE'
    | 'SESSION';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface MobileCommandStateHistoryEntry {
  mobileCommandId: string;
  previousState: MobileCommandState | null;
  newState: MobileCommandState;
  timestamp: number;
}

export interface MobileCommandReport {
  reportId: string;
  reportType: MobileCommandReportType;
  generatedAt: number;
  mobileCommandCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface MobileCommandDiagnostics {
  mobileCommandAuthorityActive: boolean;
  registeredMobileCommandCount: number;
  activeSessionCount: number;
  connectedMobileCommandCount: number;
  actionAllowedCount: number;
  actionBlockedCount: number;
  waitingApprovalCount: number;
  duplicateRiskCount: number;
  runtimeMismatchCount: number;
  workspaceMismatchCount: number;
  buildMismatchCount: number;
  verificationMismatchCount: number;
  recoveryMismatchCount: number;
  monitoringMismatchCount: number;
  lastQuery: string | null;
  lastState: MobileCommandState | null;
}

export interface MobileCommandValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterMobileCommandInput {
  commandName: string;
  mobileCommandType?: MobileCommandCategory;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringId: string;
  commandDescription?: string;
  createdBy?: string;
  visibility?: MobileCommandVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterMobileCommandResult {
  session: MobileCommandSession | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareMobileCommandRuntimeFoundationInput {
  query?: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringId: string;
  commandName?: string;
  mobileCommandType?: MobileCommandCategory;
  projectExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  verificationExists?: boolean;
  recoveryExists?: boolean;
  monitoringExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareMobileCommandRuntimeFoundationResult {
  session: MobileCommandSession | null;
  trackedSession: MobileCommandTrackedSession | null;
  reports: MobileCommandReport[];
  diagnostics: MobileCommandDiagnostics;
  validation: MobileCommandValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateMobileCommandRiskContext {
  commandName: string;
  mobileCommandType: MobileCommandCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
  verificationSummaries: string[];
  recoverySummaries: string[];
  monitoringSummaries: string[];
  world2Summaries: string[];
  aidevSummaries: string[];
}

export function isMobileCommandRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return MOBILE_COMMAND_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateMobileCommandExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_MOBILE_COMMAND_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidMobileCommandStateTransition(
  from: MobileCommandState,
  to: MobileCommandState,
): boolean {
  const allowed: Record<MobileCommandState, MobileCommandState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['CONNECTED_TO_CLOUD', 'ACTION_BLOCKED', 'WAITING_FOR_APPROVAL', 'FAILED', 'ARCHIVED'],
    CONNECTED_TO_CLOUD: ['CONNECTED_TO_WORKSPACE', 'READY', 'FAILED', 'ARCHIVED'],
    CONNECTED_TO_WORKSPACE: ['CONNECTED_TO_BUILD', 'READY', 'FAILED', 'ARCHIVED'],
    CONNECTED_TO_BUILD: ['CONNECTED_TO_VERIFICATION', 'READY', 'FAILED', 'ARCHIVED'],
    CONNECTED_TO_VERIFICATION: ['CONNECTED_TO_RECOVERY', 'READY', 'FAILED', 'ARCHIVED'],
    CONNECTED_TO_RECOVERY: ['CONNECTED_TO_MONITORING', 'READY', 'FAILED', 'ARCHIVED'],
    CONNECTED_TO_MONITORING: ['ACTION_ALLOWED', 'ACTION_BLOCKED', 'WAITING_FOR_APPROVAL', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_APPROVAL: ['ACTION_ALLOWED', 'ACTION_BLOCKED', 'FAILED', 'ARCHIVED'],
    ACTION_BLOCKED: ['WAITING_FOR_APPROVAL', 'ACTION_ALLOWED', 'FAILED', 'ARCHIVED'],
    ACTION_ALLOWED: ['COMPLETED', 'ACTION_BLOCKED', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'READY', 'CONNECTED_TO_CLOUD'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
