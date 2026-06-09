/**
 * DevPulse V2 Phase 17.5 — Cloud Recovery Foundation types.
 * Recovery coordination authority only — no recovery execution, rollback, or file mutation.
 */

export const CLOUD_RECOVERY_FOUNDATION_PASS_TOKEN = 'CLOUD_RECOVERY_FOUNDATION_V1_PASS';
export const CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE = 'devpulse_v2_cloud_recovery_foundation';
export const DUPLICATE_CLOUD_RECOVERY_RISK_PREFIX = 'DUPLICATE_CLOUD_RECOVERY_RISK';

export type CloudRecoveryCategory =
  | 'GENERAL_RECOVERY'
  | 'RUNTIME_RECOVERY'
  | 'WORKSPACE_RECOVERY'
  | 'BUILD_RECOVERY'
  | 'WORLD2_RECOVERY'
  | 'AUTONOMOUS_RECOVERY'
  | 'MOBILE_RECOVERY'
  | 'MONITORING_RECOVERY'
  | 'VERIFICATION_RECOVERY';

export type CloudRecoveryState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'FAILURE_IDENTIFIED'
  | 'RECOVERY_CANDIDATE_IDENTIFIED'
  | 'RECOVERY_PLAN_REGISTERED'
  | 'WAITING_FOR_RUNTIME'
  | 'WAITING_FOR_WORKSPACE'
  | 'WAITING_FOR_BUILD'
  | 'WAITING_FOR_VERIFICATION'
  | 'RECOVERY_READY'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type CloudRecoveryStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type CloudRecoveryVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'FOUNDER';

export type CloudRecoveryLifecycleEventType =
  | 'RECOVERY_CREATED'
  | 'RECOVERY_INITIALIZED'
  | 'FAILURE_REGISTERED'
  | 'RECOVERY_CANDIDATE_REGISTERED'
  | 'RECOVERY_PLAN_REGISTERED'
  | 'RECOVERY_LINKED_TO_VERIFICATION'
  | 'RECOVERY_LINKED_TO_RUNTIME'
  | 'RECOVERY_LINKED_TO_WORKSPACE'
  | 'RECOVERY_LINKED_TO_BUILD'
  | 'RECOVERY_READY'
  | 'RECOVERY_COMPLETED'
  | 'RECOVERY_ARCHIVED'
  | 'RECOVERY_FAILED';

export type CloudRecoveryReportType =
  | 'CLOUD_RECOVERY_INVENTORY_REPORT'
  | 'CLOUD_RECOVERY_OWNERSHIP_REPORT'
  | 'CLOUD_RECOVERY_LIFECYCLE_REPORT'
  | 'CLOUD_RECOVERY_STATE_REPORT'
  | 'CLOUD_RECOVERY_SCOPE_REPORT'
  | 'CLOUD_RECOVERY_CONTEXT_REPORT'
  | 'CLOUD_RECOVERY_RUNTIME_LINK_REPORT'
  | 'CLOUD_RECOVERY_WORKSPACE_LINK_REPORT'
  | 'CLOUD_RECOVERY_BUILD_LINK_REPORT'
  | 'CLOUD_RECOVERY_VERIFICATION_LINK_REPORT'
  | 'CLOUD_RECOVERY_HISTORY_REPORT'
  | 'CLOUD_RECOVERY_DIAGNOSTICS_REPORT';

export const TRACKED_CLOUD_RECOVERY_CATEGORIES: readonly CloudRecoveryCategory[] = [
  'GENERAL_RECOVERY',
  'RUNTIME_RECOVERY',
  'WORKSPACE_RECOVERY',
  'BUILD_RECOVERY',
  'WORLD2_RECOVERY',
  'AUTONOMOUS_RECOVERY',
  'MOBILE_RECOVERY',
  'MONITORING_RECOVERY',
  'VERIFICATION_RECOVERY',
] as const;

export const FORBIDDEN_CLOUD_RECOVERY_DUPLICATES = [
  'cloud_recovery_executor',
  'cloud_recovery_worker',
  'cloud_recovery_monolith',
  'parallel_cloud_recovery_authority',
  'recovery_runner_engine',
  'auto_recovery_engine',
] as const;

export const CLOUD_RECOVERY_QUESTION_SIGNALS = [
  'cloud recovery',
  'cloud recovery candidate',
  'recovery candidate',
  'recovery candidates',
  'recovery plan',
  'recovery plans',
  'recovery session',
  'recovery state',
  'recovery context',
  'recovery foundation',
  'recovery inventory',
  'register recovery',
  'list recoveries',
  'recovery runtime link',
  'recovery workspace link',
  'recovery build link',
  'recovery verification link',
  'recovery diagnostics',
  'recovery ownership',
  'recovery lifecycle',
  'recovery history',
  'failure identified',
  'cloud failure',
  'waiting for verification',
  'recovery ready',
] as const;

export interface CloudRecoveryOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoverySessionId: string | null;
  recoveryAuthority: string;
  creationTimestamp: number;
}

export interface CloudRecoveryProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface CloudRecoveryScope {
  scopeType: string;
  targetRuntimeId: string | null;
  targetWorkspaceId: string | null;
  targetPersistentBuildId: string | null;
  targetVerificationId: string | null;
  targetProjectId: string;
  targetSessionId: string | null;
  failureCategory: string;
  recoveryIntent: string;
  requestedBySystem: string;
  cloudRecoveryMode: 'AUTHORITY_ONLY' | 'COORDINATION_ONLY';
}

export interface CloudRecoveryContext {
  contextSummary: string;
  runtimeSummary: string | null;
  workspaceSummary: string | null;
  persistentBuildSummary: string | null;
  verificationSummary: string | null;
  failureSummary: string | null;
  candidateSummary: string | null;
  planSummary: string | null;
  vaultSummaries: string[];
  brainSummaries: string[];
  knownConstraints: string[];
}

export interface CloudRecoveryRuntimeLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudRecoveryWorkspaceLink {
  workspaceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudRecoveryPersistentBuildLink {
  persistentBuildId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudRecoveryVerificationLink {
  verificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudRecoveryRelationships {
  parentRecoveryId: string | null;
  childRecoveryIds: string[];
  relatedRuntimeIds: string[];
  relatedWorkspaceIds: string[];
  relatedPersistentBuildIds: string[];
  relatedVerificationIds: string[];
  relatedProjectIds: string[];
}

export interface CloudRecoveryMetadata {
  recoveryName: string;
  recoveryDescription: string;
  failureDescription: string | null;
  candidateDescription: string | null;
  planDescription: string | null;
  tags: string[];
  monitorable: boolean;
}

export interface CloudRecovery {
  recoveryId: string;
  recoveryType: CloudRecoveryCategory;
  recoveryOwner: CloudRecoveryOwnership;
  recoveryState: CloudRecoveryState;
  recoveryStatus: CloudRecoveryStatus;
  recoveryMetadata: CloudRecoveryMetadata;
  recoveryVisibility: CloudRecoveryVisibility;
  recoveryProvenance: CloudRecoveryProvenance;
  recoveryScope: CloudRecoveryScope;
  recoveryContext: CloudRecoveryContext;
  recoveryRuntimeLink: CloudRecoveryRuntimeLink;
  recoveryWorkspaceLink: CloudRecoveryWorkspaceLink;
  recoveryPersistentBuildLink: CloudRecoveryPersistentBuildLink;
  recoveryVerificationLink: CloudRecoveryVerificationLink;
  recoveryRelationships: CloudRecoveryRelationships;
  createdAt: number;
  updatedAt: number;
}

export interface CloudRecoverySession {
  sessionId: string;
  recoveryId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  sessionOwner: string;
  sessionState: CloudRecoveryState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: CloudRecoveryVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface CloudRecoveryLifecycleEvent {
  eventId: string;
  recoveryId: string;
  eventType: CloudRecoveryLifecycleEventType;
  previousState: CloudRecoveryState | null;
  newState: CloudRecoveryState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface CloudRecoveryHistoryEntry {
  entryId: string;
  recoveryId: string;
  category:
    | 'RECOVERY'
    | 'FAILURE'
    | 'CANDIDATE'
    | 'STATE'
    | 'OWNERSHIP'
    | 'RUNTIME'
    | 'WORKSPACE'
    | 'PERSISTENT_BUILD'
    | 'VERIFICATION'
    | 'PROJECT'
    | 'SCOPE'
    | 'CONTEXT'
    | 'LIFECYCLE'
    | 'SESSION';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface CloudRecoveryStateHistoryEntry {
  recoveryId: string;
  previousState: CloudRecoveryState | null;
  newState: CloudRecoveryState;
  timestamp: number;
}

export interface CloudRecoveryReport {
  reportId: string;
  reportType: CloudRecoveryReportType;
  generatedAt: number;
  recoveryCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface CloudRecoveryDiagnostics {
  cloudRecoveryAuthorityActive: boolean;
  registeredRecoveryCount: number;
  activeSessionCount: number;
  readyRecoveryCount: number;
  waitingRecoveryCount: number;
  blockedRecoveryCount: number;
  duplicateRiskCount: number;
  runtimeMismatchCount: number;
  workspaceMismatchCount: number;
  buildMismatchCount: number;
  verificationMismatchCount: number;
  lastQuery: string | null;
  lastState: CloudRecoveryState | null;
}

export interface CloudRecoveryValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterRecoveryInput {
  recoveryName: string;
  recoveryType?: CloudRecoveryCategory;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryDescription?: string;
  failureDescription?: string;
  candidateDescription?: string;
  planDescription?: string;
  recoveryIntent?: string;
  failureCategory?: string;
  createdBy?: string;
  visibility?: CloudRecoveryVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterRecoveryResult {
  recovery: CloudRecovery | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareCloudRecoveryFoundationInput {
  query?: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryName?: string;
  recoveryType?: CloudRecoveryCategory;
  projectExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  verificationExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareCloudRecoveryFoundationResult {
  recovery: CloudRecovery | null;
  session: CloudRecoverySession | null;
  reports: CloudRecoveryReport[];
  diagnostics: CloudRecoveryDiagnostics;
  validation: CloudRecoveryValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateCloudRecoveryRiskContext {
  recoveryName: string;
  recoveryType: CloudRecoveryCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
  verificationSummaries: string[];
}

export function isCloudRecoveryFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return CLOUD_RECOVERY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateCloudRecoveryExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_CLOUD_RECOVERY_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidCloudRecoveryStateTransition(
  from: CloudRecoveryState,
  to: CloudRecoveryState,
): boolean {
  const allowed: Record<CloudRecoveryState, CloudRecoveryState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['FAILURE_IDENTIFIED', 'WAITING_FOR_RUNTIME', 'WAITING_FOR_WORKSPACE', 'WAITING_FOR_BUILD', 'WAITING_FOR_VERIFICATION', 'FAILED', 'ARCHIVED'],
    FAILURE_IDENTIFIED: ['RECOVERY_CANDIDATE_IDENTIFIED', 'FAILED', 'ARCHIVED'],
    RECOVERY_CANDIDATE_IDENTIFIED: ['RECOVERY_PLAN_REGISTERED', 'FAILED', 'ARCHIVED'],
    RECOVERY_PLAN_REGISTERED: ['RECOVERY_READY', 'WAITING_FOR_VERIFICATION', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_RUNTIME: ['READY', 'RECOVERY_READY', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_WORKSPACE: ['READY', 'RECOVERY_READY', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_BUILD: ['READY', 'RECOVERY_READY', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_VERIFICATION: ['RECOVERY_READY', 'FAILED', 'ARCHIVED'],
    RECOVERY_READY: ['COMPLETED', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'READY', 'FAILURE_IDENTIFIED'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
