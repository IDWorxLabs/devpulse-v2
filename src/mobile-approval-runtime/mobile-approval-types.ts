/**
 * DevPulse V2 Phase 18.4 — Mobile Approval Runtime Foundation types.
 * Mobile approval authority only — no execution, push notifications, or real approvals.
 */

export const MOBILE_APPROVAL_RUNTIME_FOUNDATION_PASS_TOKEN = 'MOBILE_APPROVAL_RUNTIME_FOUNDATION_V1_PASS';
export const MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE = 'devpulse_v2_mobile_approval_runtime_foundation';
export const DUPLICATE_MOBILE_APPROVAL_RISK_PREFIX = 'DUPLICATE_MOBILE_APPROVAL_RISK';

export type MobileApprovalCategory =
  | 'GENERAL_APPROVAL'
  | 'PROJECT_APPROVAL'
  | 'WORLD2_APPROVAL'
  | 'AIDEV_APPROVAL'
  | 'AUTONOMOUS_APPROVAL'
  | 'FOUNDER_APPROVAL'
  | 'CLOUD_APPROVAL'
  | 'BUILD_APPROVAL'
  | 'SELF_EVOLUTION_APPROVAL';

export type MobileApprovalState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'REQUEST_REGISTERED'
  | 'WAITING_FOR_DECISION'
  | 'DECISION_RECORDED'
  | 'APPROVED_STATE'
  | 'REJECTED_STATE'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type MobileApprovalStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type MobileApprovalVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'FOUNDER';

export type MobileApprovalDecisionType =
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING'
  | 'EXPIRED'
  | 'REQUIRES_MORE_CONTEXT'
  | 'FOUNDER_ONLY';

export type MobileApprovalRequestResult =
  | 'REGISTERED'
  | 'DUPLICATE'
  | 'BLOCKED'
  | 'CONTEXT_REQUIRED'
  | 'FOUNDER_ONLY';

export type MobileApprovalGovernanceResult = 'ALIGNED' | 'MISALIGNED' | 'PENDING_REVIEW' | 'FOUNDER_ONLY';

export type MobileApprovalLifecycleEventType =
  | 'MOBILE_APPROVAL_CREATED'
  | 'MOBILE_APPROVAL_INITIALIZED'
  | 'MOBILE_APPROVAL_READY'
  | 'MOBILE_APPROVAL_REQUEST_REGISTERED'
  | 'MOBILE_APPROVAL_WAITING_FOR_DECISION'
  | 'MOBILE_APPROVAL_DECISION_RECORDED'
  | 'MOBILE_APPROVAL_APPROVED'
  | 'MOBILE_APPROVAL_REJECTED'
  | 'MOBILE_APPROVAL_COMPLETED'
  | 'MOBILE_APPROVAL_ARCHIVED'
  | 'MOBILE_APPROVAL_FAILED';

export type MobileApprovalReportType =
  | 'MOBILE_APPROVAL_INVENTORY_REPORT'
  | 'MOBILE_APPROVAL_OWNERSHIP_REPORT'
  | 'MOBILE_APPROVAL_LIFECYCLE_REPORT'
  | 'MOBILE_APPROVAL_STATE_REPORT'
  | 'MOBILE_APPROVAL_CONTEXT_REPORT'
  | 'MOBILE_APPROVAL_REQUEST_REPORT'
  | 'MOBILE_APPROVAL_DECISION_REPORT'
  | 'MOBILE_APPROVAL_GOVERNANCE_REPORT'
  | 'MOBILE_APPROVAL_COMMAND_LINK_REPORT'
  | 'MOBILE_APPROVAL_CHAT_LINK_REPORT'
  | 'MOBILE_APPROVAL_PREVIEW_LINK_REPORT'
  | 'MOBILE_APPROVAL_CLOUD_LINK_REPORT'
  | 'MOBILE_APPROVAL_WORKSPACE_LINK_REPORT'
  | 'MOBILE_APPROVAL_BUILD_LINK_REPORT'
  | 'MOBILE_APPROVAL_FLOW_LINK_REPORT'
  | 'MOBILE_APPROVAL_OPERATOR_FEED_REPORT'
  | 'MOBILE_APPROVAL_HISTORY_REPORT'
  | 'MOBILE_APPROVAL_DIAGNOSTICS_REPORT';

export const TRACKED_MOBILE_APPROVAL_CATEGORIES: readonly MobileApprovalCategory[] = [
  'GENERAL_APPROVAL',
  'PROJECT_APPROVAL',
  'WORLD2_APPROVAL',
  'AIDEV_APPROVAL',
  'AUTONOMOUS_APPROVAL',
  'FOUNDER_APPROVAL',
  'CLOUD_APPROVAL',
  'BUILD_APPROVAL',
  'SELF_EVOLUTION_APPROVAL',
] as const;

export const FORBIDDEN_MOBILE_APPROVAL_DUPLICATES = [
  'mobile_approval_executor',
  'mobile_approval_worker',
  'mobile_approval_monolith',
  'parallel_mobile_approval_authority',
  'mobile_approval_ui',
  'mobile_approval_notifier',
] as const;

export const MOBILE_APPROVAL_COMPANION_DOMAINS = [
  'mobile_approval_runtime_foundation',
  'mobile_command_runtime_foundation',
  'mobile_chat_runtime_foundation',
  'mobile_preview_runtime_foundation',
  'mobile_live_preview_foundation',
  'mobile_approval_flow_foundation',
] as const;

export const MOBILE_APPROVAL_QUESTION_SIGNALS = [
  'mobile approval',
  'mobile approval session',
  'mobile approval runtime',
  'mobile approval request',
  'mobile approval decision',
  'mobile approval state',
  'mobile approval context',
  'mobile approval governance',
  'mobile approval flow link',
  'mobile approval history',
  'mobile approval diagnostics',
  'mobile approval inventory',
  'register mobile approval',
  'list mobile approvals',
  'approval request registered',
  'waiting for decision',
  'decision recorded',
  'approval pending',
  'approval approved',
  'approval rejected',
  'requires more context',
  'founder only approval',
  'mobile approval foundation',
  'approval session created',
  'mobile approval command link',
  'mobile approval chat link',
  'mobile approval preview link',
  'mobile approval cloud link',
  'mobile approval workspace link',
  'mobile approval build link',
  'mobile approval operator feed',
  'self evolution approval',
  'cloud approval',
  'build approval',
  'autonomous approval',
  'authority only approval',
  'no execution approval',
] as const;

export interface MobileApprovalOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  mobileApprovalSessionId: string | null;
  mobileApprovalFlowFoundationId: string | null;
  mobileApprovalAuthority: string;
  creationTimestamp: number;
}

export type MobileApprovalRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type MobileApprovalUrgency = 'ROUTINE' | 'ELEVATED' | 'URGENT' | 'FOUNDER_IMMEDIATE';

export interface MobileApprovalRequest {
  requestId: string;
  mobileApprovalId: string;
  requestTitle: string;
  requestSummary: string;
  requestCategory: MobileApprovalCategory;
  result: MobileApprovalRequestResult;
  reason: string;
  registeredAt: number;
  requestedBy: string;
  targetAction: string;
  targetSystem: string;
  riskLevel: MobileApprovalRiskLevel;
  urgency: MobileApprovalUrgency;
  requiresFounderDecision: boolean;
  requiresMoreContext: boolean;
  contextPresent: boolean;
  commandSessionPresent: boolean;
  chatSessionPresent: boolean;
  previewSessionPresent: boolean;
  runtimePresent: boolean;
  workspacePresent: boolean;
  buildPresent: boolean;
  flowFoundationPresent: boolean;
  metadataOnly: true;
}

export interface MobileApprovalDecision {
  decisionId: string;
  mobileApprovalId: string;
  requestId: string;
  decisionType: MobileApprovalDecisionType;
  reason: string;
  recordedAt: number;
  recordedBy: string;
  sourceModule: string;
  founderOnlyDecision: boolean;
  requiresMoreContext: boolean;
  expiredDecision: boolean;
  authorityOnly: true;
  executionPerformed: false;
}

export interface MobileApprovalGovernance {
  governanceId: string;
  mobileApprovalId: string;
  result: MobileApprovalGovernanceResult;
  reason: string;
  evaluatedAt: number;
  flowFoundationPhase: string;
  flowFoundationOwnerModule: string;
  governanceAligned: boolean;
  founderOnlyRequired: boolean;
  decisionInterfaceOnly: true;
  executionBlocked: true;
}

export interface MobileApprovalContext {
  contextSummary: string;
  commandSessionSummary: string | null;
  chatSessionSummary: string | null;
  previewSessionSummary: string | null;
  runtimeSummary: string | null;
  workspaceSummary: string | null;
  persistentBuildSummary: string | null;
  flowFoundationSummary: string | null;
  operatorFeedSummary: string | null;
  projectVaultSummary: string | null;
  world2Summary: string | null;
  aidevSummary: string | null;
  vaultSummaries: string[];
  brainSummaries: string[];
  knownConstraints: string[];
}

export interface MobileApprovalCommandLink {
  mobileCommandId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalChatLink {
  mobileChatId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalPreviewLink {
  mobilePreviewId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalWorkspaceLink {
  workspaceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalBuildLink {
  persistentBuildId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalFlowLink {
  approvalFlowFoundationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
  governancePhase: string;
}

export interface MobileApprovalOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalWorld2Link {
  world2OperationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalAiDevLink {
  aidevOperationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileApprovalMetadata {
  approvalName: string;
  approvalDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface MobileApprovalProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface MobileApprovalSession {
  mobileApprovalId: string;
  mobileApprovalType: MobileApprovalCategory;
  mobileApprovalOwner: MobileApprovalOwnership;
  mobileApprovalState: MobileApprovalState;
  mobileApprovalStatus: MobileApprovalStatus;
  mobileApprovalMetadata: MobileApprovalMetadata;
  mobileApprovalVisibility: MobileApprovalVisibility;
  mobileApprovalProvenance: MobileApprovalProvenance;
  mobileApprovalContext: MobileApprovalContext;
  mobileApprovalRequests: MobileApprovalRequest[];
  mobileApprovalDecisions: MobileApprovalDecision[];
  mobileApprovalGovernance: MobileApprovalGovernance | null;
  mobileApprovalCommandLink: MobileApprovalCommandLink;
  mobileApprovalChatLink: MobileApprovalChatLink;
  mobileApprovalPreviewLink: MobileApprovalPreviewLink;
  mobileApprovalCloudLink: MobileApprovalCloudLink;
  mobileApprovalWorkspaceLink: MobileApprovalWorkspaceLink;
  mobileApprovalBuildLink: MobileApprovalBuildLink;
  mobileApprovalFlowLink: MobileApprovalFlowLink;
  mobileApprovalOperatorFeedLink: MobileApprovalOperatorFeedLink;
  mobileApprovalProjectVaultLink: MobileApprovalProjectVaultLink;
  mobileApprovalWorld2Link: MobileApprovalWorld2Link;
  mobileApprovalAiDevLink: MobileApprovalAiDevLink;
  createdAt: number;
  updatedAt: number;
}

export interface MobileApprovalTrackedSession {
  sessionId: string;
  mobileApprovalId: string;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  sessionOwner: string;
  sessionState: MobileApprovalState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: MobileApprovalVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface MobileApprovalLifecycleEvent {
  eventId: string;
  mobileApprovalId: string;
  eventType: MobileApprovalLifecycleEventType;
  previousState: MobileApprovalState | null;
  newState: MobileApprovalState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface MobileApprovalHistoryEntry {
  entryId: string;
  mobileApprovalId: string;
  category:
    | 'MOBILE_APPROVAL'
    | 'REQUEST'
    | 'DECISION'
    | 'GOVERNANCE'
    | 'STATE'
    | 'OWNERSHIP'
    | 'COMMAND'
    | 'CHAT'
    | 'PREVIEW'
    | 'RUNTIME'
    | 'WORKSPACE'
    | 'PERSISTENT_BUILD'
    | 'FLOW'
    | 'OPERATOR_FEED'
    | 'PROJECT_VAULT'
    | 'WORLD2'
    | 'AIDEV'
    | 'CONTEXT'
    | 'LIFECYCLE'
    | 'SESSION';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface MobileApprovalStateHistoryEntry {
  mobileApprovalId: string;
  previousState: MobileApprovalState | null;
  newState: MobileApprovalState;
  timestamp: number;
}

export interface MobileApprovalReport {
  reportId: string;
  reportType: MobileApprovalReportType;
  generatedAt: number;
  mobileApprovalCount: number;
  approvalRequestCount: number;
  approvalDecisionCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface MobileApprovalDiagnostics {
  mobileApprovalAuthorityActive: boolean;
  registeredMobileApprovalCount: number;
  registeredApprovalRequestCount: number;
  registeredApprovalDecisionCount: number;
  activeSessionCount: number;
  requestRegisteredCount: number;
  waitingForDecisionCount: number;
  decisionRecordedCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingDecisionCount: number;
  founderOnlyCount: number;
  duplicateRiskCount: number;
  commandMismatchCount: number;
  chatMismatchCount: number;
  previewMismatchCount: number;
  runtimeMismatchCount: number;
  workspaceMismatchCount: number;
  buildMismatchCount: number;
  flowMismatchCount: number;
  lastQuery: string | null;
  lastState: MobileApprovalState | null;
}

export interface MobileApprovalValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterMobileApprovalInput {
  approvalName: string;
  mobileApprovalType?: MobileApprovalCategory;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  mobileApprovalFlowFoundationId?: string;
  approvalDescription?: string;
  createdBy?: string;
  visibility?: MobileApprovalVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterMobileApprovalResult {
  session: MobileApprovalSession | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareMobileApprovalRuntimeFoundationInput {
  query?: string;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  mobileApprovalFlowFoundationId?: string;
  approvalName?: string;
  mobileApprovalType?: MobileApprovalCategory;
  projectExists?: boolean;
  commandSessionExists?: boolean;
  chatSessionExists?: boolean;
  previewSessionExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  flowFoundationExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareMobileApprovalRuntimeFoundationResult {
  session: MobileApprovalSession | null;
  trackedSession: MobileApprovalTrackedSession | null;
  reports: MobileApprovalReport[];
  diagnostics: MobileApprovalDiagnostics;
  validation: MobileApprovalValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateMobileApprovalRiskContext {
  approvalName: string;
  mobileApprovalType: MobileApprovalCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  mobileCommandSummaries: string[];
  mobileChatSummaries: string[];
  mobilePreviewSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
  flowFoundationSummaries: string[];
  world2Summaries: string[];
  aidevSummaries: string[];
}

export function isMobileApprovalRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return MOBILE_APPROVAL_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateMobileApprovalExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_MOBILE_APPROVAL_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidMobileApprovalStateTransition(from: MobileApprovalState, to: MobileApprovalState): boolean {
  const allowed: Record<MobileApprovalState, MobileApprovalState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['REQUEST_REGISTERED', 'FAILED', 'ARCHIVED'],
    REQUEST_REGISTERED: ['WAITING_FOR_DECISION', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_DECISION: ['DECISION_RECORDED', 'FAILED', 'ARCHIVED'],
    DECISION_RECORDED: ['APPROVED_STATE', 'REJECTED_STATE', 'FAILED', 'ARCHIVED'],
    APPROVED_STATE: ['COMPLETED', 'FAILED', 'ARCHIVED'],
    REJECTED_STATE: ['COMPLETED', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'READY', 'REQUEST_REGISTERED'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
