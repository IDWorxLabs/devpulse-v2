/**
 * DevPulse V2 Phase 17.3 — Persistent Build Runtime Foundation types.
 * Long-running build session authority only — no real builds, cloud workers, or file mutation.
 */

export const PERSISTENT_BUILD_RUNTIME_FOUNDATION_PASS_TOKEN = 'PERSISTENT_BUILD_RUNTIME_FOUNDATION_V1_PASS';
export const PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE = 'devpulse_v2_persistent_build_runtime_foundation';
export const DUPLICATE_PERSISTENT_BUILD_RISK_PREFIX = 'DUPLICATE_PERSISTENT_BUILD_RISK';

export type PersistentBuildCategory =
  | 'GENERAL_BUILD'
  | 'AIDEV_BUILD'
  | 'WORLD2_BUILD'
  | 'AUTONOMOUS_BUILD'
  | 'FOUNDER_BUILD'
  | 'MOBILE_TRIGGERED_BUILD'
  | 'VERIFICATION_TRIGGERED_BUILD'
  | 'RECOVERY_BUILD';

export type PersistentBuildState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'ACTIVE'
  | 'PAUSED'
  | 'RESUMABLE'
  | 'WAITING_FOR_APPROVAL'
  | 'WAITING_FOR_VERIFICATION'
  | 'WAITING_FOR_RECOVERY'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type PersistentBuildStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type PersistentBuildVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'FOUNDER';

export type PersistentBuildLifecycleEventType =
  | 'BUILD_CREATED'
  | 'BUILD_INITIALIZED'
  | 'BUILD_ACTIVATED'
  | 'BUILD_PAUSED'
  | 'BUILD_RESUMED'
  | 'BUILD_WAITING_FOR_APPROVAL'
  | 'BUILD_WAITING_FOR_VERIFICATION'
  | 'BUILD_WAITING_FOR_RECOVERY'
  | 'BUILD_COMPLETED'
  | 'BUILD_ARCHIVED'
  | 'BUILD_FAILED'
  | 'BUILD_LINKED_TO_RUNTIME'
  | 'BUILD_LINKED_TO_WORKSPACE';

export type PersistentBuildReportType =
  | 'PERSISTENT_BUILD_INVENTORY_REPORT'
  | 'PERSISTENT_BUILD_OWNERSHIP_REPORT'
  | 'PERSISTENT_BUILD_LIFECYCLE_REPORT'
  | 'PERSISTENT_BUILD_STATE_REPORT'
  | 'PERSISTENT_BUILD_PROGRESS_REPORT'
  | 'PERSISTENT_BUILD_CONTEXT_REPORT'
  | 'PERSISTENT_BUILD_RESUME_REPORT'
  | 'PERSISTENT_BUILD_CLOUD_LINK_REPORT'
  | 'PERSISTENT_BUILD_WORKSPACE_LINK_REPORT'
  | 'PERSISTENT_BUILD_HISTORY_REPORT'
  | 'PERSISTENT_BUILD_DIAGNOSTICS_REPORT';

export const TRACKED_PERSISTENT_BUILD_CATEGORIES: readonly PersistentBuildCategory[] = [
  'GENERAL_BUILD',
  'AIDEV_BUILD',
  'WORLD2_BUILD',
  'AUTONOMOUS_BUILD',
  'FOUNDER_BUILD',
  'MOBILE_TRIGGERED_BUILD',
  'VERIFICATION_TRIGGERED_BUILD',
  'RECOVERY_BUILD',
] as const;

export const FORBIDDEN_PERSISTENT_BUILD_DUPLICATES = [
  'persistent_build_executor',
  'build_runner_engine',
  'long_running_build_engine',
  'cloud_build_worker',
  'persistent_build_monolith',
  'parallel_build_authority',
] as const;

export const PERSISTENT_BUILD_QUESTION_SIGNALS = [
  'persistent build',
  'persistent builds',
  'persistent build session',
  'persistent build runtime',
  'build session state',
  'build progress',
  'build context',
  'build resume',
  'can build be paused',
  'can build be resumed',
  'long running build',
  'register persistent build',
  'list persistent builds',
  'build runtime link',
  'build workspace link',
  'persistent build foundation',
  'build diagnostics',
  'build ownership',
  'build lifecycle',
  'build history',
  'waiting for approval',
  'waiting for verification',
  'waiting for recovery',
] as const;

export interface PersistentBuildOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  workspaceId: string;
  runtimeId: string;
  buildSessionId: string | null;
  buildAuthority: string;
  creationTimestamp: number;
}

export interface PersistentBuildProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface PersistentBuildContext {
  currentGoal: string;
  activePlanId: string | null;
  activeTaskId: string | null;
  currentStep: string | null;
  contextSummary: string;
  knownConstraints: string[];
  requiredApprovals: string[];
  verificationRequirements: string[];
  recoveryContext: string | null;
  world2Context: string | null;
  aidevContext: string | null;
  mobileCommandContext: string | null;
}

export interface PersistentBuildProgress {
  progressState: 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETE';
  progressPercent: number;
  completedSteps: string[];
  remainingSteps: string[];
  blockedSteps: string[];
  lastProgressMessage: string;
  lastUpdatedAt: number;
}

export interface PersistentBuildResumeState {
  canResume: boolean;
  resumeReason: string | null;
  resumeCheckpointId: string | null;
  lastKnownGoodState: PersistentBuildState | null;
  lastKnownGoodTimestamp: number | null;
  resumeInstructions: string | null;
  resumeRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PersistentBuildCloudRuntimeLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PersistentBuildWorkspaceLink {
  workspaceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface PersistentBuildProjectLink {
  projectId: string;
  linkedAt: number;
  linkAuthority: string;
}

export interface PersistentBuildVerificationLink {
  evidenceReferences: string[];
  reportReferences: string[];
  linkedAt: number;
}

export interface PersistentBuildRelationships {
  parentBuildId: string | null;
  childBuildIds: string[];
  relatedRuntimeIds: string[];
  relatedWorkspaceIds: string[];
  relatedProjectIds: string[];
}

export interface PersistentBuildMetadata {
  buildName: string;
  buildDescription: string;
  tags: string[];
  pausable: boolean;
  resumable: boolean;
  monitorable: boolean;
}

export interface PersistentBuild {
  buildId: string;
  buildType: PersistentBuildCategory;
  buildOwner: PersistentBuildOwnership;
  buildState: PersistentBuildState;
  buildStatus: PersistentBuildStatus;
  buildMetadata: PersistentBuildMetadata;
  buildVisibility: PersistentBuildVisibility;
  buildProvenance: PersistentBuildProvenance;
  buildContext: PersistentBuildContext;
  buildProgress: PersistentBuildProgress;
  buildResumeState: PersistentBuildResumeState;
  buildCloudRuntimeLink: PersistentBuildCloudRuntimeLink;
  buildWorkspaceLink: PersistentBuildWorkspaceLink;
  buildProjectLink: PersistentBuildProjectLink;
  buildVerificationLink: PersistentBuildVerificationLink;
  buildRelationships: PersistentBuildRelationships;
  createdAt: number;
  updatedAt: number;
}

export interface PersistentBuildSession {
  sessionId: string;
  buildId: string;
  projectId: string;
  workspaceId: string;
  runtimeId: string;
  sessionOwner: string;
  sessionState: PersistentBuildState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: PersistentBuildVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface PersistentBuildLifecycleEvent {
  eventId: string;
  buildId: string;
  eventType: PersistentBuildLifecycleEventType;
  previousState: PersistentBuildState | null;
  newState: PersistentBuildState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface PersistentBuildHistoryEntry {
  entryId: string;
  buildId: string;
  category: 'BUILD' | 'STATE' | 'OWNERSHIP' | 'RUNTIME' | 'WORKSPACE' | 'PROJECT' | 'PROGRESS' | 'CONTEXT' | 'RESUME' | 'LIFECYCLE' | 'SESSION';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface PersistentBuildStateHistoryEntry {
  buildId: string;
  previousState: PersistentBuildState | null;
  newState: PersistentBuildState;
  timestamp: number;
}

export interface PersistentBuildReport {
  reportId: string;
  reportType: PersistentBuildReportType;
  generatedAt: number;
  buildCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface PersistentBuildDiagnostics {
  persistentBuildAuthorityActive: boolean;
  registeredBuildCount: number;
  activeSessionCount: number;
  readyBuildCount: number;
  pausedBuildCount: number;
  waitingBuildCount: number;
  blockedBuildCount: number;
  duplicateRiskCount: number;
  runtimeMismatchCount: number;
  workspaceMismatchCount: number;
  lastQuery: string | null;
  lastState: PersistentBuildState | null;
}

export interface PersistentBuildValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterPersistentBuildInput {
  buildName: string;
  buildType?: PersistentBuildCategory;
  projectId: string;
  workspaceId: string;
  runtimeId: string;
  createdBy?: string;
  buildDescription?: string;
  currentGoal?: string;
  pausable?: boolean;
  resumable?: boolean;
  visibility?: PersistentBuildVisibility;
  allowDuplicate?: boolean;
  query?: string;
  evidenceReferences?: string[];
  reportReferences?: string[];
}

export interface RegisterPersistentBuildResult {
  build: PersistentBuild | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PreparePersistentBuildFoundationInput {
  query?: string;
  projectId: string;
  workspaceId: string;
  runtimeId: string;
  buildName?: string;
  buildType?: PersistentBuildCategory;
  projectExists: boolean;
  workspaceExists: boolean;
  runtimeExists: boolean;
  ownershipValid: boolean;
  forceDuplicate?: boolean;
}

export interface PreparePersistentBuildFoundationResult {
  build: PersistentBuild | null;
  session: PersistentBuildSession | null;
  reports: PersistentBuildReport[];
  diagnostics: PersistentBuildDiagnostics;
  validation: PersistentBuildValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicatePersistentBuildRiskContext {
  buildName: string;
  buildType: PersistentBuildCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  aidevSummaries: string[];
  world2Summaries: string[];
}

export function isPersistentBuildRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return PERSISTENT_BUILD_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicatePersistentBuildExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_PERSISTENT_BUILD_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidPersistentBuildStateTransition(
  from: PersistentBuildState,
  to: PersistentBuildState,
): boolean {
  const allowed: Record<PersistentBuildState, PersistentBuildState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['ACTIVE', 'PAUSED', 'WAITING_FOR_APPROVAL', 'WAITING_FOR_VERIFICATION', 'FAILED', 'ARCHIVED'],
    ACTIVE: ['PAUSED', 'RESUMABLE', 'WAITING_FOR_APPROVAL', 'WAITING_FOR_VERIFICATION', 'WAITING_FOR_RECOVERY', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    PAUSED: ['RESUMABLE', 'ACTIVE', 'FAILED', 'ARCHIVED'],
    RESUMABLE: ['ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_APPROVAL: ['ACTIVE', 'READY', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_VERIFICATION: ['ACTIVE', 'READY', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_RECOVERY: ['RESUMABLE', 'ACTIVE', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'RESUMABLE', 'WAITING_FOR_RECOVERY'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
