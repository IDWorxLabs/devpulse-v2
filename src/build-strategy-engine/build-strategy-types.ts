/**
 * DevPulse V2 Phase 19.2 — Build Strategy Engine types.
 * Strategy/planning only — no code modification, execution, builds, tests, fixes, or deploys.
 */

export const BUILD_STRATEGY_ENGINE_PASS_TOKEN = 'BUILD_STRATEGY_ENGINE_V1_PASS';
export const BUILD_STRATEGY_ENGINE_OWNER_MODULE = 'devpulse_v2_build_strategy_engine';
export const DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK_PREFIX = 'DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK';

export type BuildStrategyCategory =
  | 'GENERAL_BUILD_STRATEGY'
  | 'PROJECT_BUILD_STRATEGY'
  | 'FEATURE_BUILD_STRATEGY'
  | 'BUGFIX_BUILD_STRATEGY'
  | 'REFACTOR_BUILD_STRATEGY'
  | 'UI_BUILD_STRATEGY'
  | 'BACKEND_BUILD_STRATEGY'
  | 'FULL_STACK_BUILD_STRATEGY'
  | 'CLOUD_BUILD_STRATEGY'
  | 'WORLD2_BUILD_STRATEGY'
  | 'AIDEV_BUILD_STRATEGY'
  | 'AUTONOMOUS_BUILD_STRATEGY'
  | 'FOUNDER_GUIDED_BUILD_STRATEGY'
  | 'SELF_EVOLUTION_BUILD_STRATEGY';

export type BuildMode =
  | 'LOCAL_BUILD'
  | 'CLOUD_BUILD'
  | 'WORLD2_BUILD'
  | 'AIDEV_BUILD'
  | 'FOUNDER_GUIDED_BUILD'
  | 'HYBRID_BUILD'
  | 'DRY_RUN_BUILD'
  | 'UNKNOWN_BUILD';

export type AutonomyLevel =
  | 'MANUAL_ONLY'
  | 'FOUNDER_APPROVAL_REQUIRED'
  | 'GUIDED_AUTONOMY'
  | 'LIMITED_AUTONOMY'
  | 'HIGH_AUTONOMY'
  | 'WORLD2_AUTONOMY'
  | 'SELF_EVOLUTION_AUTONOMY'
  | 'UNKNOWN_AUTONOMY';

export type BuildDepth =
  | 'SHALLOW_BUILD'
  | 'STANDARD_BUILD'
  | 'DEEP_BUILD'
  | 'FULL_PROJECT_BUILD'
  | 'MULTI_PROJECT_BUILD'
  | 'UNKNOWN_DEPTH';

export type BuildStrategyState =
  | 'CREATED'
  | 'CLASSIFIED'
  | 'MODE_SELECTED'
  | 'AUTONOMY_SELECTED'
  | 'RISK_EVALUATED'
  | 'CONFIDENCE_EVALUATED'
  | 'DEPTH_SELECTED'
  | 'STAGES_RECOMMENDED'
  | 'READY'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type BuildStrategyStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type BuildStrategyLifecycleEventType =
  | 'STRATEGY_CREATED'
  | 'STRATEGY_CLASSIFIED'
  | 'STRATEGY_MODE_SELECTED'
  | 'STRATEGY_AUTONOMY_SELECTED'
  | 'STRATEGY_RISK_EVALUATED'
  | 'STRATEGY_CONFIDENCE_EVALUATED'
  | 'STRATEGY_DEPTH_SELECTED'
  | 'STRATEGY_STAGES_RECOMMENDED'
  | 'STRATEGY_READINESS_EVALUATED'
  | 'STRATEGY_POLICY_APPLIED'
  | 'STRATEGY_READY'
  | 'STRATEGY_BLOCKED'
  | 'STRATEGY_COMPLETED'
  | 'STRATEGY_FAILED'
  | 'STRATEGY_ARCHIVED';

export type BuildStrategyReportType =
  | 'BUILD_STRATEGY_INVENTORY_REPORT'
  | 'BUILD_STRATEGY_OWNERSHIP_REPORT'
  | 'BUILD_STRATEGY_CLASSIFICATION_REPORT'
  | 'BUILD_STRATEGY_MODE_REPORT'
  | 'BUILD_STRATEGY_AUTONOMY_REPORT'
  | 'BUILD_STRATEGY_RISK_REPORT'
  | 'BUILD_STRATEGY_CONFIDENCE_REPORT'
  | 'BUILD_STRATEGY_DEPTH_REPORT'
  | 'BUILD_STRATEGY_STAGES_REPORT'
  | 'BUILD_STRATEGY_READINESS_REPORT'
  | 'BUILD_STRATEGY_CONSTRAINT_REPORT'
  | 'BUILD_STRATEGY_DEPENDENCY_REPORT'
  | 'BUILD_STRATEGY_POLICY_REPORT'
  | 'BUILD_STRATEGY_CONTEXT_REPORT'
  | 'BUILD_STRATEGY_STATE_REPORT'
  | 'BUILD_STRATEGY_LIFECYCLE_REPORT'
  | 'BUILD_STRATEGY_HISTORY_REPORT'
  | 'BUILD_STRATEGY_DIAGNOSTICS_REPORT'
  | 'BUILD_STRATEGY_CLOUD_REPORT'
  | 'BUILD_STRATEGY_WORLD2_REPORT'
  | 'BUILD_STRATEGY_AIDEV_REPORT'
  | 'BUILD_STRATEGY_PROJECT_VAULT_REPORT'
  | 'BUILD_STRATEGY_OPERATOR_FEED_REPORT'
  | 'BUILD_STRATEGY_NOTIFICATION_REPORT'
  | 'BUILD_STRATEGY_INBOX_REPORT'
  | 'BUILD_STRATEGY_DELIVERY_REPORT'
  | 'BUILD_STRATEGY_PUSH_REPORT'
  | 'BUILD_STRATEGY_AUTONOMOUS_BUILDER_REPORT';

export const TRACKED_BUILD_STRATEGY_CATEGORIES: readonly BuildStrategyCategory[] = [
  'GENERAL_BUILD_STRATEGY',
  'PROJECT_BUILD_STRATEGY',
  'FEATURE_BUILD_STRATEGY',
  'BUGFIX_BUILD_STRATEGY',
  'REFACTOR_BUILD_STRATEGY',
  'UI_BUILD_STRATEGY',
  'BACKEND_BUILD_STRATEGY',
  'FULL_STACK_BUILD_STRATEGY',
  'CLOUD_BUILD_STRATEGY',
  'WORLD2_BUILD_STRATEGY',
  'AIDEV_BUILD_STRATEGY',
  'AUTONOMOUS_BUILD_STRATEGY',
  'FOUNDER_GUIDED_BUILD_STRATEGY',
  'SELF_EVOLUTION_BUILD_STRATEGY',
] as const;

export const FORBIDDEN_BUILD_STRATEGY_DUPLICATES = [
  'build_strategy_executor',
  'build_strategy_worker',
  'parallel_build_strategy_authority',
  'autonomous_code_modifier',
  'build_executor',
  'test_runner',
  'deployer',
] as const;

export const BUILD_STRATEGY_COMPANION_DOMAINS = [
  'build_strategy_engine',
  'autonomous_builder_foundation',
  'mobile_push_foundation',
  'notification_delivery_foundation',
  'founder_inbox_foundation',
  'founder_notification_runtime_foundation',
  'cross_device_runtime_foundation',
] as const;

export const BUILD_STRATEGY_QUESTION_SIGNALS = [
  'build strategy',
  'build strategy engine',
  'build strategy inventory',
  'strategy planning',
  'classify build',
  'select build mode',
  'autonomy level',
  'build risk',
  'build confidence',
  'build depth',
  'recommend stages',
  'build readiness',
  'build policy',
  'register strategy',
  'list strategy',
  'planning only strategy',
  'no code execution',
  'no code modification',
] as const;

export interface BuildStrategyOwnership {
  buildStrategyId: string;
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

export interface BuildStrategyContext {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  autonomousBuildId: string;
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  crossDeviceSessionId: string;
  operatorFeedEventId: string;
}

export interface BuildStrategyClassification {
  classificationId: string;
  buildStrategyId: string;
  category: BuildStrategyCategory;
  classificationReason: string;
  classifiedAt: number;
  strategyOnly: true;
}

export interface BuildStrategyModeSelection {
  modeId: string;
  buildStrategyId: string;
  buildMode: BuildMode;
  modeReason: string;
  selectedAt: number;
  strategyOnly: true;
}

export interface BuildStrategyAutonomySelection {
  autonomyId: string;
  buildStrategyId: string;
  autonomyLevel: AutonomyLevel;
  autonomyReason: string;
  selectedAt: number;
  strategyOnly: true;
}

export interface BuildStrategyRiskEvaluation {
  riskId: string;
  buildStrategyId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  riskReason: string;
  evaluatedAt: number;
  strategyOnly: true;
}

export interface BuildStrategyConfidenceEvaluation {
  confidenceId: string;
  buildStrategyId: string;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  confidenceReason: string;
  evaluatedAt: number;
  strategyOnly: true;
}

export interface BuildStrategyDepthSelection {
  depthId: string;
  buildStrategyId: string;
  buildDepth: BuildDepth;
  depthReason: string;
  selectedAt: number;
  strategyOnly: true;
}

export interface BuildStrategyStageRecommendation {
  stageId: string;
  buildStrategyId: string;
  stageName: string;
  stageOrder: number;
  stageReason: string;
  recommendedAt: number;
  strategyOnly: true;
}

export interface BuildStrategyReadiness {
  readinessId: string;
  buildStrategyId: string;
  ready: boolean;
  readinessReason: string;
  evaluatedAt: number;
  strategyOnly: true;
}

export interface BuildStrategyConstraint {
  constraintId: string;
  buildStrategyId: string;
  constraintName: string;
  constraintReason: string;
  registeredAt: number;
  strategyOnly: true;
}

export interface BuildStrategyDependency {
  dependencyId: string;
  buildStrategyId: string;
  dependencyName: string;
  dependencyReason: string;
  registeredAt: number;
  strategyOnly: true;
}

export interface BuildStrategyPolicy {
  policyId: string;
  buildStrategyId: string;
  policyName: string;
  policyReason: string;
  appliedAt: number;
  strategyOnly: true;
}

export interface BuildStrategyAutonomousBuilderLink {
  autonomousBuildId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyDeliveryLink {
  deliveryId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyPushLink {
  pushId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyNotificationLink {
  notificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyInboxLink {
  inboxEntryId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyCloudLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyWorld2Link {
  world2OperationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyAiDevLink {
  aidevOperationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyOperatorFeedLink {
  feedAuthorityId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyProjectVaultLink {
  vaultProjectId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface BuildStrategyMetadata {
  strategyName: string;
  strategyDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface BuildStrategyProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface BuildStrategySession {
  buildStrategyId: string;
  autonomousBuildId: string;
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  strategyCategory: BuildStrategyCategory;
  strategyState: BuildStrategyState;
  strategyStatus: BuildStrategyStatus;
  strategyOwnership: BuildStrategyOwnership;
  strategyContext: BuildStrategyContext;
  strategyMetadata: BuildStrategyMetadata;
  strategyProvenance: BuildStrategyProvenance;
  strategyClassification: BuildStrategyClassification | null;
  strategyMode: BuildStrategyModeSelection | null;
  strategyAutonomy: BuildStrategyAutonomySelection | null;
  strategyRisk: BuildStrategyRiskEvaluation | null;
  strategyConfidence: BuildStrategyConfidenceEvaluation | null;
  strategyDepth: BuildStrategyDepthSelection | null;
  strategyStages: BuildStrategyStageRecommendation[];
  strategyReadiness: BuildStrategyReadiness | null;
  strategyConstraints: BuildStrategyConstraint[];
  strategyDependencies: BuildStrategyDependency[];
  strategyPolicy: BuildStrategyPolicy | null;
  strategyAutonomousBuilderLink: BuildStrategyAutonomousBuilderLink;
  strategyDeliveryLink: BuildStrategyDeliveryLink;
  strategyPushLink: BuildStrategyPushLink;
  strategyNotificationLink: BuildStrategyNotificationLink;
  strategyInboxLink: BuildStrategyInboxLink;
  strategyCloudLink: BuildStrategyCloudLink;
  strategyWorld2Link: BuildStrategyWorld2Link;
  strategyAiDevLink: BuildStrategyAiDevLink;
  strategyOperatorFeedLink: BuildStrategyOperatorFeedLink;
  strategyProjectVaultLink: BuildStrategyProjectVaultLink;
  createdAt: number;
  updatedAt: number;
}

export interface BuildStrategyLifecycleEvent {
  eventId: string;
  buildStrategyId: string;
  eventType: BuildStrategyLifecycleEventType;
  previousState: BuildStrategyState | null;
  newState: BuildStrategyState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface BuildStrategyHistoryEntry {
  entryId: string;
  buildStrategyId: string;
  category:
    | 'STRATEGY'
    | 'OWNERSHIP'
    | 'STATE'
    | 'CLASSIFICATION'
    | 'MODE'
    | 'AUTONOMY'
    | 'RISK'
    | 'CONFIDENCE'
    | 'DEPTH'
    | 'STAGES'
    | 'READINESS'
    | 'CONSTRAINT'
    | 'DEPENDENCY'
    | 'POLICY'
    | 'AUTONOMOUS_BUILDER'
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

export interface BuildStrategyStateHistoryEntry {
  buildStrategyId: string;
  previousState: BuildStrategyState | null;
  newState: BuildStrategyState;
  timestamp: number;
}

export interface BuildStrategyReport {
  reportId: string;
  reportType: BuildStrategyReportType;
  generatedAt: number;
  strategyRecordCount: number;
  lifecycleEventCount: number;
  summary: string;
  findings: string[];
  strategyOnly: true;
}

export interface BuildStrategyDiagnostics {
  strategyPlanningActive: boolean;
  registeredStrategyCount: number;
  classifiedStrategyCount: number;
  modeSelectedCount: number;
  autonomySelectedCount: number;
  riskEvaluatedCount: number;
  confidenceEvaluatedCount: number;
  depthSelectedCount: number;
  stagesRecommendedCount: number;
  readyStrategyCount: number;
  blockedStrategyCount: number;
  completedStrategyCount: number;
  failedStrategyCount: number;
  archivedStrategyCount: number;
  duplicateRiskCount: number;
  autonomousBuilderMismatchCount: number;
  deliveryMismatchCount: number;
  pushMismatchCount: number;
  notificationMismatchCount: number;
  inboxMismatchCount: number;
  cloudMismatchCount: number;
  world2MismatchCount: number;
  aidevMismatchCount: number;
  lastQuery: string | null;
  lastState: BuildStrategyState | null;
}

export interface BuildStrategyValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterBuildStrategyInput {
  strategyName: string;
  autonomousBuildId: string;
  pushId: string;
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  strategyCategory?: BuildStrategyCategory;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  strategyDescription?: string;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterBuildStrategyResult {
  record: BuildStrategySession | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareBuildStrategyEngineInput {
  query?: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  autonomousBuildId?: string;
  pushId?: string;
  deliveryId?: string;
  notificationId?: string;
  inboxEntryId?: string;
  strategyName?: string;
  strategyCategory?: BuildStrategyCategory;
  projectExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  crossDeviceSessionExists?: boolean;
  autonomousBuildExists?: boolean;
  pushExists?: boolean;
  deliveryExists?: boolean;
  notificationExists?: boolean;
  inboxEntryExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareBuildStrategyEngineResult {
  record: BuildStrategySession | null;
  reports: BuildStrategyReport[];
  diagnostics: BuildStrategyDiagnostics;
  validation: BuildStrategyValidationResult;
  responseText: string;
  strategyOnly: true;
}

export interface DuplicateBuildStrategyRiskContext {
  strategyName: string;
  strategyCategory: BuildStrategyCategory;
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
  autonomousBuilderSummaries: string[];
}

export function isBuildStrategyEngineQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  if (lower.includes('mobile push') && !lower.includes('build strategy')) return false;
  return BUILD_STRATEGY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateBuildStrategyExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_BUILD_STRATEGY_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidBuildStrategyStateTransition(
  from: BuildStrategyState,
  to: BuildStrategyState,
): boolean {
  const allowed: Record<BuildStrategyState, BuildStrategyState[]> = {
    CREATED: ['CLASSIFIED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    CLASSIFIED: ['MODE_SELECTED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    MODE_SELECTED: ['AUTONOMY_SELECTED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    AUTONOMY_SELECTED: ['RISK_EVALUATED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    RISK_EVALUATED: ['CONFIDENCE_EVALUATED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    CONFIDENCE_EVALUATED: ['DEPTH_SELECTED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    DEPTH_SELECTED: ['STAGES_RECOMMENDED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    STAGES_RECOMMENDED: ['READY', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    READY: ['COMPLETED', 'FAILED', 'BLOCKED', 'ARCHIVED'],
    BLOCKED: ['CLASSIFIED', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['CREATED', 'CLASSIFIED', 'ARCHIVED'],
    ARCHIVED: ['CREATED', 'CLASSIFIED'],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function validateBuildStrategyState(state: BuildStrategyState): boolean {
  const valid: BuildStrategyState[] = [
    'CREATED', 'CLASSIFIED', 'MODE_SELECTED', 'AUTONOMY_SELECTED',
    'RISK_EVALUATED', 'CONFIDENCE_EVALUATED', 'DEPTH_SELECTED',
    'STAGES_RECOMMENDED', 'READY', 'BLOCKED', 'COMPLETED', 'FAILED', 'ARCHIVED',
  ];
  return valid.includes(state);
}

export function resolveDefaultBuildModeForCategory(category: BuildStrategyCategory): BuildMode {
  const map: Record<BuildStrategyCategory, BuildMode> = {
    GENERAL_BUILD_STRATEGY: 'LOCAL_BUILD',
    PROJECT_BUILD_STRATEGY: 'LOCAL_BUILD',
    FEATURE_BUILD_STRATEGY: 'LOCAL_BUILD',
    BUGFIX_BUILD_STRATEGY: 'LOCAL_BUILD',
    REFACTOR_BUILD_STRATEGY: 'LOCAL_BUILD',
    UI_BUILD_STRATEGY: 'LOCAL_BUILD',
    BACKEND_BUILD_STRATEGY: 'LOCAL_BUILD',
    FULL_STACK_BUILD_STRATEGY: 'HYBRID_BUILD',
    CLOUD_BUILD_STRATEGY: 'CLOUD_BUILD',
    WORLD2_BUILD_STRATEGY: 'WORLD2_BUILD',
    AIDEV_BUILD_STRATEGY: 'AIDEV_BUILD',
    AUTONOMOUS_BUILD_STRATEGY: 'HYBRID_BUILD',
    FOUNDER_GUIDED_BUILD_STRATEGY: 'FOUNDER_GUIDED_BUILD',
    SELF_EVOLUTION_BUILD_STRATEGY: 'DRY_RUN_BUILD',
  };
  return map[category];
}

export function resolveDefaultAutonomyForCategory(category: BuildStrategyCategory): AutonomyLevel {
  const map: Record<BuildStrategyCategory, AutonomyLevel> = {
    GENERAL_BUILD_STRATEGY: 'GUIDED_AUTONOMY',
    PROJECT_BUILD_STRATEGY: 'GUIDED_AUTONOMY',
    FEATURE_BUILD_STRATEGY: 'LIMITED_AUTONOMY',
    BUGFIX_BUILD_STRATEGY: 'FOUNDER_APPROVAL_REQUIRED',
    REFACTOR_BUILD_STRATEGY: 'FOUNDER_APPROVAL_REQUIRED',
    UI_BUILD_STRATEGY: 'GUIDED_AUTONOMY',
    BACKEND_BUILD_STRATEGY: 'LIMITED_AUTONOMY',
    FULL_STACK_BUILD_STRATEGY: 'LIMITED_AUTONOMY',
    CLOUD_BUILD_STRATEGY: 'HIGH_AUTONOMY',
    WORLD2_BUILD_STRATEGY: 'WORLD2_AUTONOMY',
    AIDEV_BUILD_STRATEGY: 'HIGH_AUTONOMY',
    AUTONOMOUS_BUILD_STRATEGY: 'HIGH_AUTONOMY',
    FOUNDER_GUIDED_BUILD_STRATEGY: 'MANUAL_ONLY',
    SELF_EVOLUTION_BUILD_STRATEGY: 'SELF_EVOLUTION_AUTONOMY',
  };
  return map[category];
}

export function resolveDefaultDepthForCategory(category: BuildStrategyCategory): BuildDepth {
  const map: Record<BuildStrategyCategory, BuildDepth> = {
    GENERAL_BUILD_STRATEGY: 'STANDARD_BUILD',
    PROJECT_BUILD_STRATEGY: 'FULL_PROJECT_BUILD',
    FEATURE_BUILD_STRATEGY: 'STANDARD_BUILD',
    BUGFIX_BUILD_STRATEGY: 'SHALLOW_BUILD',
    REFACTOR_BUILD_STRATEGY: 'DEEP_BUILD',
    UI_BUILD_STRATEGY: 'STANDARD_BUILD',
    BACKEND_BUILD_STRATEGY: 'DEEP_BUILD',
    FULL_STACK_BUILD_STRATEGY: 'FULL_PROJECT_BUILD',
    CLOUD_BUILD_STRATEGY: 'DEEP_BUILD',
    WORLD2_BUILD_STRATEGY: 'DEEP_BUILD',
    AIDEV_BUILD_STRATEGY: 'STANDARD_BUILD',
    AUTONOMOUS_BUILD_STRATEGY: 'FULL_PROJECT_BUILD',
    FOUNDER_GUIDED_BUILD_STRATEGY: 'STANDARD_BUILD',
    SELF_EVOLUTION_BUILD_STRATEGY: 'MULTI_PROJECT_BUILD',
  };
  return map[category];
}

export function resolveDefaultStageNamesForCategory(category: BuildStrategyCategory): string[] {
  const map: Record<BuildStrategyCategory, string[]> = {
    GENERAL_BUILD_STRATEGY: ['Classify', 'Select Mode', 'Evaluate Risk', 'Recommend Stages'],
    PROJECT_BUILD_STRATEGY: ['Project Scope', 'Mode Selection', 'Risk Assessment', 'Stage Plan'],
    FEATURE_BUILD_STRATEGY: ['Feature Scope', 'Mode Selection', 'Confidence Check', 'Stage Plan'],
    BUGFIX_BUILD_STRATEGY: ['Issue Scope', 'Risk Check', 'Minimal Depth', 'Stage Plan'],
    REFACTOR_BUILD_STRATEGY: ['Refactor Scope', 'Depth Selection', 'Risk Assessment', 'Stage Plan'],
    UI_BUILD_STRATEGY: ['UI Scope', 'Mode Selection', 'Confidence Check', 'Stage Plan'],
    BACKEND_BUILD_STRATEGY: ['Backend Scope', 'Mode Selection', 'Risk Assessment', 'Stage Plan'],
    FULL_STACK_BUILD_STRATEGY: ['Full Stack Scope', 'Hybrid Mode', 'Risk Assessment', 'Stage Plan'],
    CLOUD_BUILD_STRATEGY: ['Cloud Scope', 'Cloud Mode', 'Risk Assessment', 'Stage Plan'],
    WORLD2_BUILD_STRATEGY: ['World2 Scope', 'World2 Mode', 'Autonomy Check', 'Stage Plan'],
    AIDEV_BUILD_STRATEGY: ['AiDev Scope', 'AiDev Mode', 'Confidence Check', 'Stage Plan'],
    AUTONOMOUS_BUILD_STRATEGY: ['Autonomous Scope', 'Hybrid Mode', 'Autonomy Check', 'Stage Plan'],
    FOUNDER_GUIDED_BUILD_STRATEGY: ['Founder Scope', 'Manual Mode', 'Policy Check', 'Stage Plan'],
    SELF_EVOLUTION_BUILD_STRATEGY: ['Evolution Scope', 'Dry Run Mode', 'Self Autonomy', 'Stage Plan'],
  };
  return map[category];
}
