/**
 * DevPulse V2 Phase 19.1 — Autonomous Builder Foundation types.
 * Build planning, goal/plan/stage metadata, readiness evaluation — no code execution.
 */

export const AUTONOMOUS_BUILDER_FOUNDATION_PASS_TOKEN = 'AUTONOMOUS_BUILDER_FOUNDATION_V1_PASS';
export const AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE = 'devpulse_v2_autonomous_builder_foundation';
export const DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK_PREFIX = 'DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK';

export type AutonomousBuildCategory =
  | 'GENERAL_AUTONOMOUS_BUILD'
  | 'PROJECT_AUTONOMOUS_BUILD'
  | 'WORLD2_AUTONOMOUS_BUILD'
  | 'CLOUD_AUTONOMOUS_BUILD'
  | 'AIDEV_AUTONOMOUS_BUILD'
  | 'FOUNDER_AUTONOMOUS_BUILD'
  | 'SELF_EVOLUTION_AUTONOMOUS_BUILD'
  | 'VERIFICATION_AUTONOMOUS_BUILD'
  | 'TESTING_AUTONOMOUS_BUILD'
  | 'FIXING_AUTONOMOUS_BUILD';

export type AutonomousBuildState =
  | 'CREATED'
  | 'PLANNING'
  | 'READY'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type AutonomousBuildStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type AutonomousBuildLifecycleEventType =
  | 'BUILD_CREATED'
  | 'BUILD_GOAL_CREATED'
  | 'BUILD_PLAN_CREATED'
  | 'BUILD_STAGE_CREATED'
  | 'BUILD_READINESS_EVALUATED'
  | 'BUILD_PLANNING'
  | 'BUILD_READY'
  | 'BUILD_WAITING'
  | 'BUILD_IN_PROGRESS'
  | 'BUILD_PAUSED'
  | 'BUILD_BLOCKED'
  | 'BUILD_COMPLETED'
  | 'BUILD_FAILED'
  | 'BUILD_ARCHIVED';

export type AutonomousBuildReportType =
  | 'AUTONOMOUS_BUILD_INVENTORY_REPORT'
  | 'AUTONOMOUS_BUILD_OWNERSHIP_REPORT'
  | 'AUTONOMOUS_BUILD_GOAL_REPORT'
  | 'AUTONOMOUS_BUILD_PLAN_REPORT'
  | 'AUTONOMOUS_BUILD_STAGE_REPORT'
  | 'AUTONOMOUS_BUILD_READINESS_REPORT'
  | 'AUTONOMOUS_BUILD_CONSTRAINT_REPORT'
  | 'AUTONOMOUS_BUILD_CAPABILITY_REPORT'
  | 'AUTONOMOUS_BUILD_CONTEXT_REPORT'
  | 'AUTONOMOUS_BUILD_STATE_REPORT'
  | 'AUTONOMOUS_BUILD_LIFECYCLE_REPORT'
  | 'AUTONOMOUS_BUILD_HISTORY_REPORT'
  | 'AUTONOMOUS_BUILD_DIAGNOSTICS_REPORT'
  | 'AUTONOMOUS_BUILD_CLOUD_REPORT'
  | 'AUTONOMOUS_BUILD_WORLD2_REPORT'
  | 'AUTONOMOUS_BUILD_AIDEV_REPORT'
  | 'AUTONOMOUS_BUILD_PROJECT_VAULT_REPORT'
  | 'AUTONOMOUS_BUILD_OPERATOR_FEED_REPORT'
  | 'AUTONOMOUS_BUILD_NOTIFICATION_REPORT'
  | 'AUTONOMOUS_BUILD_INBOX_REPORT'
  | 'AUTONOMOUS_BUILD_DELIVERY_REPORT'
  | 'AUTONOMOUS_BUILD_PUSH_REPORT';

export const TRACKED_AUTONOMOUS_BUILD_CATEGORIES: readonly AutonomousBuildCategory[] = [
  'GENERAL_AUTONOMOUS_BUILD',
  'PROJECT_AUTONOMOUS_BUILD',
  'WORLD2_AUTONOMOUS_BUILD',
  'CLOUD_AUTONOMOUS_BUILD',
  'AIDEV_AUTONOMOUS_BUILD',
  'FOUNDER_AUTONOMOUS_BUILD',
  'SELF_EVOLUTION_AUTONOMOUS_BUILD',
  'VERIFICATION_AUTONOMOUS_BUILD',
  'TESTING_AUTONOMOUS_BUILD',
  'FIXING_AUTONOMOUS_BUILD',
] as const;

export const FORBIDDEN_AUTONOMOUS_BUILDER_DUPLICATES = [
  'autonomous_builder_executor',
  'autonomous_builder_worker',
  'parallel_autonomous_builder_authority',
  'autonomous_code_modifier',
  'autonomous_build_executor',
  'autonomous_test_runner',
  'autonomous_deployer',
] as const;

export const AUTONOMOUS_BUILDER_COMPANION_DOMAINS = [
  'autonomous_builder_foundation',
  'mobile_push_foundation',
  'notification_delivery_foundation',
  'founder_inbox_foundation',
  'founder_notification_runtime_foundation',
  'cross_device_runtime_foundation',
] as const;

export const AUTONOMOUS_BUILDER_QUESTION_SIGNALS = [
  'autonomous build',
  'autonomous builder',
  'autonomous builder foundation',
  'autonomous build inventory',
  'build planning',
  'build goal',
  'build plan',
  'build stage',
  'build readiness',
  'build constraint',
  'build capability',
  'register build',
  'list build',
  'plan build',
  'evaluate readiness',
  'planning only build',
  'no code execution',
  'no autonomous executor',
] as const;

export interface AutonomousBuildOwnership {
  autonomousBuildId: string;
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

export interface AutonomousBuildContext {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  crossDeviceSessionId: string;
  operatorFeedEventId: string;
}

export interface AutonomousBuildGoal {
  goalId: string;
  autonomousBuildId: string;
  goalName: string;
  goalDescription: string;
  category: AutonomousBuildCategory;
  planningOnly: true;
  createdAt: number;
}

export interface AutonomousBuildPlan {
  planId: string;
  autonomousBuildId: string;
  planName: string;
  planSummary: string;
  stageCount: number;
  planningOnly: true;
  createdAt: number;
}

export interface AutonomousBuildStage {
  stageId: string;
  autonomousBuildId: string;
  planId: string;
  stageName: string;
  stageOrder: number;
  stageReason: string;
  planningOnly: true;
  createdAt: number;
}

export interface AutonomousBuildReadiness {
  readinessId: string;
  autonomousBuildId: string;
  ready: boolean;
  readinessReason: string;
  evaluatedAt: number;
  planningOnly: true;
}

export interface AutonomousBuildConstraint {
  constraintId: string;
  autonomousBuildId: string;
  constraintName: string;
  constraintReason: string;
  registeredAt: number;
  planningOnly: true;
}

export interface AutonomousBuildCapability {
  capabilityId: string;
  autonomousBuildId: string;
  capabilityName: string;
  capabilityReason: string;
  registeredAt: number;
  planningOnly: true;
}

export interface AutonomousBuildDeliveryLink {
  deliveryId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface AutonomousBuildPushLink {
  pushId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface AutonomousBuildNotificationLink {
  notificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface AutonomousBuildInboxLink {
  inboxEntryId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface AutonomousBuildCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface AutonomousBuildWorld2Link {
  world2OperationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface AutonomousBuildAiDevLink {
  aidevOperationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface AutonomousBuildOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface AutonomousBuildProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface AutonomousBuildMetadata {
  buildName: string;
  buildDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface AutonomousBuildProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface AutonomousBuildSession {
  autonomousBuildId: string;
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  buildCategory: AutonomousBuildCategory;
  buildState: AutonomousBuildState;
  buildStatus: AutonomousBuildStatus;
  buildOwnership: AutonomousBuildOwnership;
  buildContext: AutonomousBuildContext;
  buildMetadata: AutonomousBuildMetadata;
  buildProvenance: AutonomousBuildProvenance;
  buildGoal: AutonomousBuildGoal | null;
  buildPlan: AutonomousBuildPlan | null;
  buildStages: AutonomousBuildStage[];
  buildReadiness: AutonomousBuildReadiness | null;
  buildConstraints: AutonomousBuildConstraint[];
  buildCapabilities: AutonomousBuildCapability[];
  buildDeliveryLink: AutonomousBuildDeliveryLink;
  buildPushLink: AutonomousBuildPushLink;
  buildNotificationLink: AutonomousBuildNotificationLink;
  buildInboxLink: AutonomousBuildInboxLink;
  buildCloudLink: AutonomousBuildCloudLink;
  buildWorld2Link: AutonomousBuildWorld2Link;
  buildAiDevLink: AutonomousBuildAiDevLink;
  buildOperatorFeedLink: AutonomousBuildOperatorFeedLink;
  buildProjectVaultLink: AutonomousBuildProjectVaultLink;
  createdAt: number;
  updatedAt: number;
}

export interface AutonomousBuildLifecycleEvent {
  eventId: string;
  autonomousBuildId: string;
  eventType: AutonomousBuildLifecycleEventType;
  previousState: AutonomousBuildState | null;
  newState: AutonomousBuildState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface AutonomousBuildHistoryEntry {
  entryId: string;
  autonomousBuildId: string;
  category:
    | 'BUILD'
    | 'OWNERSHIP'
    | 'STATE'
    | 'GOAL'
    | 'PLAN'
    | 'STAGE'
    | 'READINESS'
    | 'CONSTRAINT'
    | 'CAPABILITY'
    | 'DELIVERY'
    | 'PUSH'
    | 'NOTIFICATION'
    | 'INBOX'
    | 'CLOUD'
    | 'WORLD2'
    | 'AIDEV'
    | 'OPERATOR_FEED'
    | 'PROJECT_VAULT'
    | 'CONTEXT'
    | 'LIFECYCLE';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface AutonomousBuildStateHistoryEntry {
  autonomousBuildId: string;
  previousState: AutonomousBuildState | null;
  newState: AutonomousBuildState;
  timestamp: number;
}

export interface AutonomousBuildReport {
  reportId: string;
  reportType: AutonomousBuildReportType;
  generatedAt: number;
  buildRecordCount: number;
  lifecycleEventCount: number;
  summary: string;
  findings: string[];
  planningOnly: true;
}

export interface AutonomousBuildDiagnostics {
  buildPlanningActive: boolean;
  registeredBuildCount: number;
  planningBuildCount: number;
  readyBuildCount: number;
  waitingBuildCount: number;
  inProgressBuildCount: number;
  pausedBuildCount: number;
  blockedBuildCount: number;
  completedBuildCount: number;
  failedBuildCount: number;
  archivedBuildCount: number;
  duplicateRiskCount: number;
  deliveryMismatchCount: number;
  pushMismatchCount: number;
  notificationMismatchCount: number;
  inboxMismatchCount: number;
  cloudMismatchCount: number;
  world2MismatchCount: number;
  aidevMismatchCount: number;
  lastQuery: string | null;
  lastState: AutonomousBuildState | null;
}

export interface AutonomousBuildValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterAutonomousBuildInput {
  buildName: string;
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  buildCategory?: AutonomousBuildCategory;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  buildDescription?: string;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterAutonomousBuildResult {
  record: AutonomousBuildSession | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareAutonomousBuilderFoundationInput {
  query?: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  pushId?: string;
  deliveryId?: string;
  notificationId?: string;
  inboxEntryId?: string;
  buildName?: string;
  buildCategory?: AutonomousBuildCategory;
  projectExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  crossDeviceSessionExists?: boolean;
  pushExists?: boolean;
  deliveryExists?: boolean;
  notificationExists?: boolean;
  inboxEntryExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareAutonomousBuilderFoundationResult {
  record: AutonomousBuildSession | null;
  reports: AutonomousBuildReport[];
  diagnostics: AutonomousBuildDiagnostics;
  validation: AutonomousBuildValidationResult;
  responseText: string;
  planningOnly: true;
}

export interface DuplicateAutonomousBuilderRiskContext {
  buildName: string;
  buildCategory: AutonomousBuildCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  operatorFeedSummaries: string[];
  deliverySummaries: string[];
  pushSummaries: string[];
  notificationSummaries: string[];
  inboxSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
}

export function isAutonomousBuilderFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  if (lower.includes('mobile push') && !lower.includes('autonomous build')) return false;
  return AUTONOMOUS_BUILDER_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateAutonomousBuilderExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_AUTONOMOUS_BUILDER_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidAutonomousBuildStateTransition(
  from: AutonomousBuildState,
  to: AutonomousBuildState,
): boolean {
  const allowed: Record<AutonomousBuildState, AutonomousBuildState[]> = {
    CREATED: ['PLANNING', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    PLANNING: ['READY', 'WAITING', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    READY: ['IN_PROGRESS', 'WAITING', 'COMPLETED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    WAITING: ['PLANNING', 'IN_PROGRESS', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    IN_PROGRESS: ['PAUSED', 'COMPLETED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    PAUSED: ['IN_PROGRESS', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    BLOCKED: ['PLANNING', 'PAUSED', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['CREATED', 'PLANNING', 'ARCHIVED'],
    ARCHIVED: ['CREATED', 'PLANNING'],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function validateAutonomousBuildState(state: AutonomousBuildState): boolean {
  const valid: AutonomousBuildState[] = [
    'CREATED', 'PLANNING', 'READY', 'WAITING', 'IN_PROGRESS', 'PAUSED',
    'BLOCKED', 'COMPLETED', 'FAILED', 'ARCHIVED',
  ];
  return valid.includes(state);
}

export function resolveDefaultStageNamesForCategory(category: AutonomousBuildCategory): string[] {
  const map: Record<AutonomousBuildCategory, string[]> = {
    GENERAL_AUTONOMOUS_BUILD: ['Scope', 'Plan', 'Validate'],
    PROJECT_AUTONOMOUS_BUILD: ['Project Scope', 'Plan', 'Validate'],
    WORLD2_AUTONOMOUS_BUILD: ['World2 Scope', 'Plan', 'Validate'],
    CLOUD_AUTONOMOUS_BUILD: ['Cloud Scope', 'Plan', 'Validate'],
    AIDEV_AUTONOMOUS_BUILD: ['AiDev Scope', 'Plan', 'Validate'],
    FOUNDER_AUTONOMOUS_BUILD: ['Founder Scope', 'Plan', 'Validate'],
    SELF_EVOLUTION_AUTONOMOUS_BUILD: ['Evolution Scope', 'Plan', 'Validate'],
    VERIFICATION_AUTONOMOUS_BUILD: ['Verification Scope', 'Plan', 'Validate'],
    TESTING_AUTONOMOUS_BUILD: ['Testing Scope', 'Plan', 'Validate'],
    FIXING_AUTONOMOUS_BUILD: ['Fix Scope', 'Plan', 'Validate'],
  };
  return map[category];
}
