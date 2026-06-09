/**
 * DevPulse V2 Phase 18.2 — Mobile Chat Runtime Foundation types.
 * Mobile chat authority only — no mobile UI, LLM execution, or cloud execution.
 */

export const MOBILE_CHAT_RUNTIME_FOUNDATION_PASS_TOKEN = 'MOBILE_CHAT_RUNTIME_FOUNDATION_V1_PASS';
export const MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE = 'devpulse_v2_mobile_chat_runtime_foundation';
export const DUPLICATE_MOBILE_CHAT_RISK_PREFIX = 'DUPLICATE_MOBILE_CHAT_RISK';

export type MobileChatCategory =
  | 'GENERAL_MOBILE_CHAT'
  | 'PROJECT_MOBILE_CHAT'
  | 'WORLD2_MOBILE_CHAT'
  | 'AIDEV_MOBILE_CHAT'
  | 'AUTONOMOUS_MOBILE_CHAT'
  | 'FOUNDER_MOBILE_CHAT'
  | 'VERIFICATION_MOBILE_CHAT'
  | 'MONITORING_MOBILE_CHAT'
  | 'APP_BUILD_MOBILE_CHAT';

export type MobileChatState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'PROMPT_RECEIVED'
  | 'CONTEXT_READY'
  | 'ROUTED_TO_COMMAND'
  | 'WAITING_FOR_APPROVAL'
  | 'ACTION_BLOCKED'
  | 'ACTION_ALLOWED'
  | 'RESPONSE_PENDING'
  | 'RESPONSE_READY'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type MobileChatStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type MobileChatVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'FOUNDER';

export type MobileChatActionGateResult =
  | 'ALLOW'
  | 'BLOCK'
  | 'REQUIRES_APPROVAL'
  | 'DESKTOP_RECOMMENDED'
  | 'FOUNDER_ONLY'
  | 'CONTEXT_REQUIRED';

export type MobileChatLifecycleEventType =
  | 'MOBILE_CHAT_CREATED'
  | 'MOBILE_CHAT_INITIALIZED'
  | 'MOBILE_CHAT_PROMPT_RECEIVED'
  | 'MOBILE_CHAT_CONTEXT_READY'
  | 'MOBILE_CHAT_ROUTED_TO_COMMAND'
  | 'MOBILE_CHAT_WAITING_FOR_APPROVAL'
  | 'MOBILE_CHAT_ACTION_BLOCKED'
  | 'MOBILE_CHAT_ACTION_ALLOWED'
  | 'MOBILE_CHAT_RESPONSE_PENDING'
  | 'MOBILE_CHAT_RESPONSE_READY'
  | 'MOBILE_CHAT_COMPLETED'
  | 'MOBILE_CHAT_ARCHIVED'
  | 'MOBILE_CHAT_FAILED';

export type MobileChatReportType =
  | 'MOBILE_CHAT_INVENTORY_REPORT'
  | 'MOBILE_CHAT_OWNERSHIP_REPORT'
  | 'MOBILE_CHAT_LIFECYCLE_REPORT'
  | 'MOBILE_CHAT_STATE_REPORT'
  | 'MOBILE_CHAT_CONTEXT_REPORT'
  | 'MOBILE_CHAT_MESSAGE_REPORT'
  | 'MOBILE_CHAT_PROMPT_REPORT'
  | 'MOBILE_CHAT_RESPONSE_STATE_REPORT'
  | 'MOBILE_CHAT_COMMAND_ROUTING_REPORT'
  | 'MOBILE_CHAT_ACTION_GATE_REPORT'
  | 'MOBILE_CHAT_CLOUD_LINK_REPORT'
  | 'MOBILE_CHAT_WORKSPACE_LINK_REPORT'
  | 'MOBILE_CHAT_BUILD_LINK_REPORT'
  | 'MOBILE_CHAT_VERIFICATION_LINK_REPORT'
  | 'MOBILE_CHAT_MONITORING_LINK_REPORT'
  | 'MOBILE_CHAT_OPERATOR_FEED_REPORT'
  | 'MOBILE_CHAT_PROJECT_VAULT_REPORT'
  | 'MOBILE_CHAT_HISTORY_REPORT'
  | 'MOBILE_CHAT_DIAGNOSTICS_REPORT';

export const TRACKED_MOBILE_CHAT_CATEGORIES: readonly MobileChatCategory[] = [
  'GENERAL_MOBILE_CHAT',
  'PROJECT_MOBILE_CHAT',
  'WORLD2_MOBILE_CHAT',
  'AIDEV_MOBILE_CHAT',
  'AUTONOMOUS_MOBILE_CHAT',
  'FOUNDER_MOBILE_CHAT',
  'VERIFICATION_MOBILE_CHAT',
  'MONITORING_MOBILE_CHAT',
  'APP_BUILD_MOBILE_CHAT',
] as const;

export const FORBIDDEN_MOBILE_CHAT_DUPLICATES = [
  'mobile_chat_executor',
  'mobile_chat_worker',
  'mobile_chat_monolith',
  'parallel_mobile_chat_authority',
  'mobile_llm_runtime',
  'mobile_chat_ui',
] as const;

export const MOBILE_CHAT_QUESTION_SIGNALS = [
  'mobile chat',
  'mobile chat session',
  'mobile chat runtime',
  'mobile chat message',
  'mobile chat prompt',
  'mobile chat response',
  'mobile chat routing',
  'mobile chat context',
  'mobile chat action gate',
  'mobile chat history',
  'mobile chat diagnostics',
  'mobile chat inventory',
  'register mobile chat',
  'list mobile chats',
  'prompt received',
  'response pending',
  'response ready',
  'giant prompt',
  'routed to command',
  'mobile chat foundation',
  'chat session created',
  'mobile chat cloud link',
  'mobile chat workspace link',
  'mobile chat build link',
  'mobile chat verification link',
  'mobile chat monitoring link',
  'mobile chat operator feed',
  'mobile chat project vault',
  'context required',
  'desktop recommended',
  'founder only chat',
] as const;

export interface MobileChatOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  mobileCommandSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  monitoringId: string;
  mobileChatSessionId: string | null;
  mobileChatAuthority: string;
  creationTimestamp: number;
}

export interface MobileChatPermissions {
  allowedChatActions: string[];
  blockedChatActions: string[];
  requiresApprovalActions: string[];
  desktopOnlyActions: string[];
  founderOnlyActions: string[];
  mobilePreviewAllowed: boolean;
  mobilePreviewBlockedReason: string | null;
  largeSystemDesktopRecommended: boolean;
}

export interface MobileChatPrompt {
  promptId: string;
  mobileChatId: string;
  promptText: string;
  promptType: string;
  promptSource: string;
  promptTimestamp: number;
  promptAttachmentsMetadata: string[];
  voiceInputMetadata: Record<string, string> | null;
  imageInputMetadata: Record<string, string> | null;
  videoInputMetadata: Record<string, string> | null;
  giantPromptFlag: boolean;
  longPromptSummary: string | null;
  projectVisionDetected: boolean;
  requestedActionDetected: string | null;
}

export interface MobileChatResponseState {
  responseId: string;
  mobileChatId: string;
  responseStatus: 'PENDING' | 'READY' | 'BLOCKED' | 'FAILED';
  responseSummary: string;
  responseVisibility: MobileChatVisibility;
  responseReferences: string[];
  responsePendingReason: string | null;
  responseReadyTimestamp: number | null;
}

export interface MobileChatMessage {
  messageId: string;
  mobileChatId: string;
  messageRole: 'USER' | 'SYSTEM' | 'ASSISTANT_METADATA';
  messageText: string;
  messageTimestamp: number;
  promptId: string | null;
  responseId: string | null;
  metadataOnly: true;
}

export interface MobileChatCommandRoute {
  routeId: string;
  mobileChatId: string;
  targetSystem: string;
  routeReason: string;
  routedAt: number;
  metadataOnly: true;
}

export interface MobileChatActionGateEntry {
  gateId: string;
  mobileChatId: string;
  actionName: string;
  result: MobileChatActionGateResult;
  reason: string;
  evaluatedAt: number;
}

export interface MobileChatContext {
  contextSummary: string;
  commandSessionSummary: string | null;
  runtimeSummary: string | null;
  workspaceSummary: string | null;
  persistentBuildSummary: string | null;
  verificationSummary: string | null;
  monitoringSummary: string | null;
  operatorFeedSummary: string | null;
  projectVaultSummary: string | null;
  world2Summary: string | null;
  aidevSummary: string | null;
  vaultSummaries: string[];
  brainSummaries: string[];
  knownConstraints: string[];
}

export interface MobileChatCommandLink {
  mobileCommandId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileChatCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileChatWorkspaceLink {
  workspaceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileChatBuildLink {
  persistentBuildId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileChatVerificationLink {
  verificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileChatMonitoringLink {
  monitoringId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileChatOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileChatProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobileChatMetadata {
  chatName: string;
  chatDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface MobileChatProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface MobileChatSession {
  mobileChatId: string;
  mobileChatType: MobileChatCategory;
  mobileChatOwner: MobileChatOwnership;
  mobileChatState: MobileChatState;
  mobileChatStatus: MobileChatStatus;
  mobileChatMetadata: MobileChatMetadata;
  mobileChatVisibility: MobileChatVisibility;
  mobileChatProvenance: MobileChatProvenance;
  mobileChatContext: MobileChatContext;
  mobileChatPermissions: MobileChatPermissions;
  mobileChatPrompts: MobileChatPrompt[];
  mobileChatResponseState: MobileChatResponseState | null;
  mobileChatCommandRoutes: MobileChatCommandRoute[];
  mobileChatActionGateResults: MobileChatActionGateEntry[];
  mobileChatCommandLink: MobileChatCommandLink;
  mobileChatCloudLink: MobileChatCloudLink;
  mobileChatWorkspaceLink: MobileChatWorkspaceLink;
  mobileChatBuildLink: MobileChatBuildLink;
  mobileChatVerificationLink: MobileChatVerificationLink;
  mobileChatMonitoringLink: MobileChatMonitoringLink;
  mobileChatOperatorFeedLink: MobileChatOperatorFeedLink;
  mobileChatProjectVaultLink: MobileChatProjectVaultLink;
  createdAt: number;
  updatedAt: number;
}

export interface MobileChatTrackedSession {
  sessionId: string;
  mobileChatId: string;
  projectId: string;
  mobileCommandSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  monitoringId: string;
  sessionOwner: string;
  sessionState: MobileChatState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: MobileChatVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface MobileChatLifecycleEvent {
  eventId: string;
  mobileChatId: string;
  eventType: MobileChatLifecycleEventType;
  previousState: MobileChatState | null;
  newState: MobileChatState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface MobileChatHistoryEntry {
  entryId: string;
  mobileChatId: string;
  category:
    | 'MOBILE_CHAT'
    | 'MESSAGE'
    | 'PROMPT'
    | 'RESPONSE'
    | 'ROUTING'
    | 'STATE'
    | 'OWNERSHIP'
    | 'COMMAND'
    | 'RUNTIME'
    | 'WORKSPACE'
    | 'PERSISTENT_BUILD'
    | 'VERIFICATION'
    | 'MONITORING'
    | 'ACTION_GATE'
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

export interface MobileChatStateHistoryEntry {
  mobileChatId: string;
  previousState: MobileChatState | null;
  newState: MobileChatState;
  timestamp: number;
}

export interface MobileChatReport {
  reportId: string;
  reportType: MobileChatReportType;
  generatedAt: number;
  mobileChatCount: number;
  messageCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface MobileChatDiagnostics {
  mobileChatAuthorityActive: boolean;
  registeredMobileChatCount: number;
  registeredMessageCount: number;
  activeSessionCount: number;
  promptReceivedCount: number;
  responseReadyCount: number;
  actionAllowedCount: number;
  actionBlockedCount: number;
  waitingApprovalCount: number;
  duplicateRiskCount: number;
  commandMismatchCount: number;
  runtimeMismatchCount: number;
  workspaceMismatchCount: number;
  buildMismatchCount: number;
  verificationMismatchCount: number;
  monitoringMismatchCount: number;
  lastQuery: string | null;
  lastState: MobileChatState | null;
}

export interface MobileChatValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterMobileChatInput {
  chatName: string;
  mobileChatType?: MobileChatCategory;
  projectId: string;
  mobileCommandSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  monitoringId: string;
  chatDescription?: string;
  createdBy?: string;
  visibility?: MobileChatVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterMobileChatResult {
  session: MobileChatSession | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareMobileChatRuntimeFoundationInput {
  query?: string;
  projectId: string;
  mobileCommandSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  monitoringId: string;
  chatName?: string;
  mobileChatType?: MobileChatCategory;
  promptText?: string;
  projectExists?: boolean;
  commandSessionExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  verificationExists?: boolean;
  monitoringExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareMobileChatRuntimeFoundationResult {
  session: MobileChatSession | null;
  trackedSession: MobileChatTrackedSession | null;
  reports: MobileChatReport[];
  diagnostics: MobileChatDiagnostics;
  validation: MobileChatValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateMobileChatRiskContext {
  chatName: string;
  mobileChatType: MobileChatCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  mobileCommandSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
  verificationSummaries: string[];
  monitoringSummaries: string[];
  world2Summaries: string[];
  aidevSummaries: string[];
}

export function isMobileChatRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return MOBILE_CHAT_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateMobileChatExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_MOBILE_CHAT_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidMobileChatStateTransition(from: MobileChatState, to: MobileChatState): boolean {
  const allowed: Record<MobileChatState, MobileChatState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['PROMPT_RECEIVED', 'FAILED', 'ARCHIVED'],
    PROMPT_RECEIVED: ['CONTEXT_READY', 'FAILED', 'ARCHIVED'],
    CONTEXT_READY: ['ROUTED_TO_COMMAND', 'WAITING_FOR_APPROVAL', 'FAILED', 'ARCHIVED'],
    ROUTED_TO_COMMAND: ['ACTION_BLOCKED', 'ACTION_ALLOWED', 'WAITING_FOR_APPROVAL', 'RESPONSE_PENDING', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_APPROVAL: ['ACTION_ALLOWED', 'ACTION_BLOCKED', 'FAILED', 'ARCHIVED'],
    ACTION_BLOCKED: ['WAITING_FOR_APPROVAL', 'ACTION_ALLOWED', 'FAILED', 'ARCHIVED'],
    ACTION_ALLOWED: ['RESPONSE_PENDING', 'ACTION_BLOCKED', 'FAILED', 'ARCHIVED'],
    RESPONSE_PENDING: ['RESPONSE_READY', 'FAILED', 'ARCHIVED'],
    RESPONSE_READY: ['COMPLETED', 'RESPONSE_PENDING', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'READY', 'PROMPT_RECEIVED'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
