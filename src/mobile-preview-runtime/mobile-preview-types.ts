/**
 * DevPulse V2 Phase 18.3 — Mobile Preview Runtime Foundation types.
 * Mobile preview authority only — no mobile UI, preview execution, or preview streaming.
 */

export const MOBILE_PREVIEW_RUNTIME_FOUNDATION_PASS_TOKEN = 'MOBILE_PREVIEW_RUNTIME_FOUNDATION_V1_PASS';
export const MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE = 'devpulse_v2_mobile_preview_runtime_foundation';
export const DUPLICATE_MOBILE_PREVIEW_RISK_PREFIX = 'DUPLICATE_MOBILE_PREVIEW_RISK';

export type MobilePreviewCategory =
  | 'GENERAL_MOBILE_PREVIEW'
  | 'PROJECT_MOBILE_PREVIEW'
  | 'WORLD2_MOBILE_PREVIEW'
  | 'AIDEV_MOBILE_PREVIEW'
  | 'AUTONOMOUS_MOBILE_PREVIEW'
  | 'FOUNDER_MOBILE_PREVIEW'
  | 'VERIFICATION_MOBILE_PREVIEW'
  | 'BUILD_MOBILE_PREVIEW'
  | 'LIVE_PREVIEW_MOBILE_PREVIEW';

export type MobilePreviewState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'ELIGIBILITY_CHECKED'
  | 'SAFETY_CHECKED'
  | 'MOBILE_PREVIEW_ALLOWED'
  | 'MOBILE_PREVIEW_BLOCKED'
  | 'DESKTOP_RECOMMENDED'
  | 'PREVIEW_LINK_REGISTERED'
  | 'PREVIEW_PENDING'
  | 'PREVIEW_READY'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type MobilePreviewStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type MobilePreviewVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'FOUNDER';

export type MobilePreviewDesktopRecommendationLevel =
  | 'DESKTOP_NOT_REQUIRED'
  | 'DESKTOP_RECOMMENDED'
  | 'DESKTOP_REQUIRED'
  | 'MOBILE_BLOCKED';

export type MobilePreviewEligibilityResult =
  | 'ELIGIBLE'
  | 'INELIGIBLE'
  | 'DESKTOP_RECOMMENDED'
  | 'CONTEXT_REQUIRED'
  | 'FOUNDER_ONLY';

export type MobilePreviewSafetyResult = 'SAFE' | 'UNSAFE' | 'REQUIRES_DESKTOP' | 'BLOCKED';

export type MobilePreviewLifecycleEventType =
  | 'MOBILE_PREVIEW_CREATED'
  | 'MOBILE_PREVIEW_INITIALIZED'
  | 'MOBILE_PREVIEW_ELIGIBILITY_CHECKED'
  | 'MOBILE_PREVIEW_SAFETY_CHECKED'
  | 'MOBILE_PREVIEW_ALLOWED'
  | 'MOBILE_PREVIEW_BLOCKED'
  | 'MOBILE_PREVIEW_DESKTOP_RECOMMENDED'
  | 'MOBILE_PREVIEW_LINK_REGISTERED'
  | 'MOBILE_PREVIEW_PENDING'
  | 'MOBILE_PREVIEW_READY'
  | 'MOBILE_PREVIEW_COMPLETED'
  | 'MOBILE_PREVIEW_ARCHIVED'
  | 'MOBILE_PREVIEW_FAILED';

export type MobilePreviewReportType =
  | 'MOBILE_PREVIEW_INVENTORY_REPORT'
  | 'MOBILE_PREVIEW_OWNERSHIP_REPORT'
  | 'MOBILE_PREVIEW_LIFECYCLE_REPORT'
  | 'MOBILE_PREVIEW_STATE_REPORT'
  | 'MOBILE_PREVIEW_CONTEXT_REPORT'
  | 'MOBILE_PREVIEW_ELIGIBILITY_REPORT'
  | 'MOBILE_PREVIEW_SAFETY_REPORT'
  | 'MOBILE_PREVIEW_DEVICE_POLICY_REPORT'
  | 'MOBILE_PREVIEW_DESKTOP_RECOMMENDATION_REPORT'
  | 'MOBILE_PREVIEW_LINK_REPORT'
  | 'MOBILE_PREVIEW_COMMAND_LINK_REPORT'
  | 'MOBILE_PREVIEW_CHAT_LINK_REPORT'
  | 'MOBILE_PREVIEW_CLOUD_LINK_REPORT'
  | 'MOBILE_PREVIEW_WORKSPACE_LINK_REPORT'
  | 'MOBILE_PREVIEW_BUILD_LINK_REPORT'
  | 'MOBILE_PREVIEW_VERIFICATION_LINK_REPORT'
  | 'MOBILE_PREVIEW_OPERATOR_FEED_REPORT'
  | 'MOBILE_PREVIEW_HISTORY_REPORT'
  | 'MOBILE_PREVIEW_DIAGNOSTICS_REPORT';

export const TRACKED_MOBILE_PREVIEW_CATEGORIES: readonly MobilePreviewCategory[] = [
  'GENERAL_MOBILE_PREVIEW',
  'PROJECT_MOBILE_PREVIEW',
  'WORLD2_MOBILE_PREVIEW',
  'AIDEV_MOBILE_PREVIEW',
  'AUTONOMOUS_MOBILE_PREVIEW',
  'FOUNDER_MOBILE_PREVIEW',
  'VERIFICATION_MOBILE_PREVIEW',
  'BUILD_MOBILE_PREVIEW',
  'LIVE_PREVIEW_MOBILE_PREVIEW',
] as const;

export const FORBIDDEN_MOBILE_PREVIEW_DUPLICATES = [
  'mobile_preview_executor',
  'mobile_preview_worker',
  'mobile_preview_monolith',
  'parallel_mobile_preview_authority',
  'mobile_preview_ui',
  'mobile_preview_streamer',
] as const;

export const MOBILE_PREVIEW_COMPANION_DOMAINS = [
  'mobile_preview_runtime_foundation',
  'mobile_chat_runtime_foundation',
  'mobile_command_runtime_foundation',
  'mobile_approval_runtime_foundation',
  'mobile_live_preview_foundation',
  'live_preview_runtime',
] as const;

export const MOBILE_PREVIEW_QUESTION_SIGNALS = [
  'mobile preview',
  'mobile preview session',
  'mobile preview runtime',
  'mobile preview link',
  'mobile preview eligibility',
  'mobile preview safety',
  'mobile preview device policy',
  'mobile preview desktop recommendation',
  'mobile preview state',
  'mobile preview context',
  'mobile preview history',
  'mobile preview diagnostics',
  'mobile preview inventory',
  'register mobile preview',
  'list mobile previews',
  'preview link registered',
  'preview pending',
  'preview ready',
  'desktop recommended preview',
  'desktop required preview',
  'mobile preview blocked',
  'mobile preview allowed',
  'mobile preview foundation',
  'preview session created',
  'mobile preview command link',
  'mobile preview chat link',
  'mobile preview cloud link',
  'mobile preview workspace link',
  'mobile preview build link',
  'mobile preview verification link',
  'mobile preview live preview link',
  'eligibility checked',
  'safety checked',
  'live preview mobile',
  'founder only preview',
] as const;

export interface MobilePreviewOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  mobilePreviewSessionId: string | null;
  mobilePreviewAuthority: string;
  creationTimestamp: number;
}

export type MobilePreviewProjectSizeCategory = 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';

export type MobilePreviewTargetComplexity = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export type MobilePreviewEstimatedDeviceLoad = 'LIGHT' | 'MODERATE' | 'HEAVY' | 'EXCESSIVE';

export interface MobilePreviewEligibility {
  eligibilityId: string;
  mobilePreviewId: string;
  result: MobilePreviewEligibilityResult;
  reason: string;
  evaluatedAt: number;
  eligibleForMobilePreview: boolean;
  eligibilityReason: string;
  projectSizeCategory: MobilePreviewProjectSizeCategory;
  targetComplexity: MobilePreviewTargetComplexity;
  estimatedDeviceLoad: MobilePreviewEstimatedDeviceLoad;
  requiresDesktop: boolean;
  desktopRecommended: boolean;
  mobilePreviewAllowed: boolean;
  mobilePreviewBlockedReason: string | null;
  projectContextPresent: boolean;
  commandSessionPresent: boolean;
  chatSessionPresent: boolean;
  runtimePresent: boolean;
  workspacePresent: boolean;
  buildPresent: boolean;
  verificationPresent: boolean;
}

export type MobilePreviewSafetyRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface MobilePreviewSafety {
  safetyId: string;
  mobilePreviewId: string;
  result: MobilePreviewSafetyResult;
  reason: string;
  evaluatedAt: number;
  safeToPreviewOnMobile: boolean;
  safetyRiskLevel: MobilePreviewSafetyRiskLevel;
  safetyReasons: string[];
  largeSystemRisk: boolean;
  resourcePressureRisk: boolean;
  sensitivePreviewRisk: boolean;
  unstableRuntimeRisk: boolean;
  requiresFounderApproval: boolean;
  mobileSafe: boolean;
  desktopRequired: boolean;
  securityWarnings: string[];
  governanceWarnings: string[];
}

export type MobilePreviewBatterySensitivity = 'LOW' | 'MODERATE' | 'HIGH';

export interface MobilePreviewDevicePolicy {
  policyId: string;
  mobilePreviewId: string;
  deviceClass: string;
  networkClass: string;
  screenClass: string;
  batterySensitivity: MobilePreviewBatterySensitivity;
  mobilePreviewPolicy: string;
  desktopFallbackPolicy: string;
  allowedDeviceTypes: string[];
  blockedDeviceTypes: string[];
  requiresDesktopForLargeSystems: boolean;
  mobilePreviewAllowed: boolean;
  mobilePreviewBlockedReason: string | null;
  largeSystemDesktopRecommended: boolean;
  founderOnlyPreview: boolean;
  evaluatedAt: number;
}

export interface MobilePreviewDesktopRecommendation {
  recommendationId: string;
  mobilePreviewId: string;
  level: MobilePreviewDesktopRecommendationLevel;
  reason: string;
  recommendedAt: number;
  sourceModule: string;
}

export interface MobilePreviewLink {
  linkId: string;
  mobilePreviewId: string;
  projectId: string;
  workspaceId: string;
  persistentBuildId: string;
  linkType: string;
  urlMetadata: string;
  previewTarget: string;
  previewType: string;
  linkUrl: string;
  linkAuthority: string;
  registeredAt: number;
  metadataOnly: true;
}

export interface MobilePreviewContext {
  contextSummary: string;
  commandSessionSummary: string | null;
  chatSessionSummary: string | null;
  runtimeSummary: string | null;
  workspaceSummary: string | null;
  persistentBuildSummary: string | null;
  verificationSummary: string | null;
  livePreviewSummary: string | null;
  operatorFeedSummary: string | null;
  projectVaultSummary: string | null;
  world2Summary: string | null;
  aidevSummary: string | null;
  vaultSummaries: string[];
  brainSummaries: string[];
  knownConstraints: string[];
}

export interface MobilePreviewCommandLink {
  mobileCommandId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobilePreviewChatLink {
  mobileChatId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobilePreviewCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobilePreviewWorkspaceLink {
  workspaceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobilePreviewBuildLink {
  persistentBuildId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobilePreviewVerificationLink {
  verificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobilePreviewLivePreviewLink {
  livePreviewSessionId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobilePreviewOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface MobilePreviewMetadata {
  previewName: string;
  previewDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface MobilePreviewProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface MobilePreviewSession {
  mobilePreviewId: string;
  mobilePreviewType: MobilePreviewCategory;
  mobilePreviewOwner: MobilePreviewOwnership;
  mobilePreviewState: MobilePreviewState;
  mobilePreviewStatus: MobilePreviewStatus;
  mobilePreviewMetadata: MobilePreviewMetadata;
  mobilePreviewVisibility: MobilePreviewVisibility;
  mobilePreviewProvenance: MobilePreviewProvenance;
  mobilePreviewContext: MobilePreviewContext;
  mobilePreviewEligibility: MobilePreviewEligibility | null;
  mobilePreviewSafety: MobilePreviewSafety | null;
  mobilePreviewDevicePolicy: MobilePreviewDevicePolicy | null;
  mobilePreviewDesktopRecommendations: MobilePreviewDesktopRecommendation[];
  mobilePreviewLinks: MobilePreviewLink[];
  mobilePreviewCommandLink: MobilePreviewCommandLink;
  mobilePreviewChatLink: MobilePreviewChatLink;
  mobilePreviewCloudLink: MobilePreviewCloudLink;
  mobilePreviewWorkspaceLink: MobilePreviewWorkspaceLink;
  mobilePreviewBuildLink: MobilePreviewBuildLink;
  mobilePreviewVerificationLink: MobilePreviewVerificationLink;
  mobilePreviewLivePreviewLink: MobilePreviewLivePreviewLink;
  mobilePreviewOperatorFeedLink: MobilePreviewOperatorFeedLink;
  createdAt: number;
  updatedAt: number;
}

export interface MobilePreviewTrackedSession {
  sessionId: string;
  mobilePreviewId: string;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  sessionOwner: string;
  sessionState: MobilePreviewState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: MobilePreviewVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface MobilePreviewLifecycleEvent {
  eventId: string;
  mobilePreviewId: string;
  eventType: MobilePreviewLifecycleEventType;
  previousState: MobilePreviewState | null;
  newState: MobilePreviewState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface MobilePreviewHistoryEntry {
  entryId: string;
  mobilePreviewId: string;
  category:
    | 'MOBILE_PREVIEW'
    | 'ELIGIBILITY'
    | 'SAFETY'
    | 'DEVICE_POLICY'
    | 'DESKTOP_RECOMMENDATION'
    | 'PREVIEW_LINK'
    | 'STATE'
    | 'OWNERSHIP'
    | 'COMMAND'
    | 'CHAT'
    | 'RUNTIME'
    | 'WORKSPACE'
    | 'PERSISTENT_BUILD'
    | 'VERIFICATION'
    | 'LIVE_PREVIEW'
    | 'OPERATOR_FEED'
    | 'CONTEXT'
    | 'LIFECYCLE'
    | 'SESSION';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface MobilePreviewStateHistoryEntry {
  mobilePreviewId: string;
  previousState: MobilePreviewState | null;
  newState: MobilePreviewState;
  timestamp: number;
}

export interface MobilePreviewReport {
  reportId: string;
  reportType: MobilePreviewReportType;
  generatedAt: number;
  mobilePreviewCount: number;
  previewLinkCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface MobilePreviewDiagnostics {
  mobilePreviewAuthorityActive: boolean;
  registeredMobilePreviewCount: number;
  registeredPreviewLinkCount: number;
  activeSessionCount: number;
  eligibilityCheckedCount: number;
  safetyCheckedCount: number;
  previewAllowedCount: number;
  previewBlockedCount: number;
  desktopRecommendedCount: number;
  previewReadyCount: number;
  duplicateRiskCount: number;
  commandMismatchCount: number;
  chatMismatchCount: number;
  runtimeMismatchCount: number;
  workspaceMismatchCount: number;
  buildMismatchCount: number;
  verificationMismatchCount: number;
  livePreviewMismatchCount: number;
  lastQuery: string | null;
  lastState: MobilePreviewState | null;
}

export interface MobilePreviewValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterMobilePreviewInput {
  previewName: string;
  mobilePreviewType?: MobilePreviewCategory;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  previewDescription?: string;
  createdBy?: string;
  visibility?: MobilePreviewVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterMobilePreviewResult {
  session: MobilePreviewSession | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareMobilePreviewRuntimeFoundationInput {
  query?: string;
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  previewName?: string;
  mobilePreviewType?: MobilePreviewCategory;
  projectExists?: boolean;
  commandSessionExists?: boolean;
  chatSessionExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  verificationExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareMobilePreviewRuntimeFoundationResult {
  session: MobilePreviewSession | null;
  trackedSession: MobilePreviewTrackedSession | null;
  reports: MobilePreviewReport[];
  diagnostics: MobilePreviewDiagnostics;
  validation: MobilePreviewValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateMobilePreviewRiskContext {
  previewName: string;
  mobilePreviewType: MobilePreviewCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  mobileCommandSummaries: string[];
  mobileChatSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
  verificationSummaries: string[];
  livePreviewSummaries: string[];
  world2Summaries: string[];
  aidevSummaries: string[];
}

export function isMobilePreviewRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return MOBILE_PREVIEW_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateMobilePreviewExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_MOBILE_PREVIEW_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidMobilePreviewStateTransition(from: MobilePreviewState, to: MobilePreviewState): boolean {
  const allowed: Record<MobilePreviewState, MobilePreviewState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['ELIGIBILITY_CHECKED', 'FAILED', 'ARCHIVED'],
    ELIGIBILITY_CHECKED: ['SAFETY_CHECKED', 'MOBILE_PREVIEW_BLOCKED', 'DESKTOP_RECOMMENDED', 'FAILED', 'ARCHIVED'],
    SAFETY_CHECKED: ['MOBILE_PREVIEW_ALLOWED', 'MOBILE_PREVIEW_BLOCKED', 'DESKTOP_RECOMMENDED', 'FAILED', 'ARCHIVED'],
    MOBILE_PREVIEW_ALLOWED: ['PREVIEW_LINK_REGISTERED', 'PREVIEW_PENDING', 'FAILED', 'ARCHIVED'],
    MOBILE_PREVIEW_BLOCKED: ['DESKTOP_RECOMMENDED', 'READY', 'FAILED', 'ARCHIVED'],
    DESKTOP_RECOMMENDED: ['PREVIEW_LINK_REGISTERED', 'MOBILE_PREVIEW_BLOCKED', 'FAILED', 'ARCHIVED'],
    PREVIEW_LINK_REGISTERED: ['PREVIEW_PENDING', 'FAILED', 'ARCHIVED'],
    PREVIEW_PENDING: ['PREVIEW_READY', 'FAILED', 'ARCHIVED'],
    PREVIEW_READY: ['COMPLETED', 'PREVIEW_PENDING', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'READY', 'ELIGIBILITY_CHECKED'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
