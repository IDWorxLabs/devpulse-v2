/**
 * DevPulse V2 Phase 17.4 — Cloud Verification Foundation types.
 * Cloud-specific verification authority only — no provider execution, cloud workers, or file mutation.
 */

export const CLOUD_VERIFICATION_FOUNDATION_PASS_TOKEN = 'CLOUD_VERIFICATION_FOUNDATION_V1_PASS';
export const CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE = 'devpulse_v2_cloud_verification_foundation';
export const DUPLICATE_CLOUD_VERIFICATION_RISK_PREFIX = 'DUPLICATE_CLOUD_VERIFICATION_RISK';

export type CloudVerificationCategory =
  | 'GENERAL_CLOUD_VERIFICATION'
  | 'RUNTIME_VERIFICATION'
  | 'WORKSPACE_VERIFICATION'
  | 'PERSISTENT_BUILD_VERIFICATION'
  | 'WORLD2_CLOUD_VERIFICATION'
  | 'AUTONOMOUS_CLOUD_VERIFICATION'
  | 'MOBILE_CLOUD_VERIFICATION'
  | 'RECOVERY_CLOUD_VERIFICATION'
  | 'MONITORING_CLOUD_VERIFICATION';

export type CloudVerificationState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'REQUESTED'
  | 'IN_PROGRESS_METADATA_ONLY'
  | 'EVIDENCE_LINKED'
  | 'REPORT_LINKED'
  | 'WAITING_FOR_RUNTIME'
  | 'WAITING_FOR_WORKSPACE'
  | 'WAITING_FOR_BUILD'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type CloudVerificationStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type CloudVerificationVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'FOUNDER';

export type CloudVerificationLifecycleEventType =
  | 'VERIFICATION_CREATED'
  | 'VERIFICATION_INITIALIZED'
  | 'VERIFICATION_REQUESTED'
  | 'VERIFICATION_EVIDENCE_LINKED'
  | 'VERIFICATION_REPORT_LINKED'
  | 'VERIFICATION_WAITING_FOR_RUNTIME'
  | 'VERIFICATION_WAITING_FOR_WORKSPACE'
  | 'VERIFICATION_WAITING_FOR_BUILD'
  | 'VERIFICATION_LINKED_TO_UNIFIED_ENTRY'
  | 'VERIFICATION_LINKED_TO_RUNTIME'
  | 'VERIFICATION_LINKED_TO_WORKSPACE'
  | 'VERIFICATION_LINKED_TO_PERSISTENT_BUILD'
  | 'VERIFICATION_COMPLETED'
  | 'VERIFICATION_ARCHIVED'
  | 'VERIFICATION_FAILED';

export type CloudVerificationReportType =
  | 'CLOUD_VERIFICATION_INVENTORY_REPORT'
  | 'CLOUD_VERIFICATION_OWNERSHIP_REPORT'
  | 'CLOUD_VERIFICATION_LIFECYCLE_REPORT'
  | 'CLOUD_VERIFICATION_STATE_REPORT'
  | 'CLOUD_VERIFICATION_SCOPE_REPORT'
  | 'CLOUD_VERIFICATION_CONTEXT_REPORT'
  | 'CLOUD_VERIFICATION_EVIDENCE_LINK_REPORT'
  | 'CLOUD_VERIFICATION_REPORT_LINK_REPORT'
  | 'CLOUD_VERIFICATION_RUNTIME_LINK_REPORT'
  | 'CLOUD_VERIFICATION_WORKSPACE_LINK_REPORT'
  | 'CLOUD_VERIFICATION_PERSISTENT_BUILD_LINK_REPORT'
  | 'CLOUD_VERIFICATION_HISTORY_REPORT'
  | 'CLOUD_VERIFICATION_DIAGNOSTICS_REPORT';

export const TRACKED_CLOUD_VERIFICATION_CATEGORIES: readonly CloudVerificationCategory[] = [
  'GENERAL_CLOUD_VERIFICATION',
  'RUNTIME_VERIFICATION',
  'WORKSPACE_VERIFICATION',
  'PERSISTENT_BUILD_VERIFICATION',
  'WORLD2_CLOUD_VERIFICATION',
  'AUTONOMOUS_CLOUD_VERIFICATION',
  'MOBILE_CLOUD_VERIFICATION',
  'RECOVERY_CLOUD_VERIFICATION',
  'MONITORING_CLOUD_VERIFICATION',
] as const;

export const FORBIDDEN_CLOUD_VERIFICATION_DUPLICATES = [
  'cloud_verification_executor',
  'cloud_verification_provider',
  'cloud_verification_monolith',
  'parallel_cloud_verification_authority',
  'cloud_verification_worker',
  'verification_runner_engine',
] as const;

export const CLOUD_VERIFICATION_QUESTION_SIGNALS = [
  'cloud verification',
  'cloud verification request',
  'cloud verification requests',
  'cloud verification session',
  'cloud verification state',
  'cloud verification scope',
  'cloud verification context',
  'cloud verification evidence',
  'cloud verification report',
  'cloud verification foundation',
  'cloud verification inventory',
  'register cloud verification',
  'list cloud verifications',
  'verification runtime link',
  'verification workspace link',
  'verification build link',
  'verification diagnostics',
  'verification ownership',
  'verification lifecycle',
  'verification history',
  'waiting for runtime',
  'waiting for workspace',
  'waiting for build',
  'unified entry link',
] as const;

export interface CloudVerificationOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationSessionId: string | null;
  verificationAuthority: string;
  creationTimestamp: number;
}

export interface CloudVerificationProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface CloudVerificationScope {
  scopeType: string;
  targetRuntimeId: string | null;
  targetWorkspaceId: string | null;
  targetPersistentBuildId: string | null;
  targetProjectId: string;
  targetSessionId: string | null;
  verificationDepth: 'SHALLOW' | 'STANDARD' | 'DEEP';
  verificationIntent: string;
  requestedBySystem: string;
  cloudVerificationMode: 'AUTHORITY_ONLY' | 'COORDINATION_ONLY';
}

export interface CloudVerificationContext {
  contextSummary: string;
  runtimeSummary: string | null;
  workspaceSummary: string | null;
  persistentBuildSummary: string | null;
  unifiedEntrySummary: string | null;
  evidenceSummary: string | null;
  reportSummary: string | null;
  vaultSummaries: string[];
  brainSummaries: string[];
  knownConstraints: string[];
}

export interface CloudVerificationUnifiedEntryLink {
  unifiedSessionId: string;
  unifiedRequestId: string | null;
  authorityId: string | null;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudVerificationEvidenceLink {
  evidenceIds: string[];
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudVerificationReportLink {
  reportIds: string[];
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudVerificationRuntimeLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudVerificationWorkspaceLink {
  workspaceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudVerificationPersistentBuildLink {
  persistentBuildId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudVerificationRelationships {
  parentVerificationId: string | null;
  childVerificationIds: string[];
  relatedRuntimeIds: string[];
  relatedWorkspaceIds: string[];
  relatedPersistentBuildIds: string[];
  relatedProjectIds: string[];
}

export interface CloudVerificationMetadata {
  verificationName: string;
  verificationDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface CloudVerification {
  verificationId: string;
  verificationType: CloudVerificationCategory;
  verificationOwner: CloudVerificationOwnership;
  verificationState: CloudVerificationState;
  verificationStatus: CloudVerificationStatus;
  verificationMetadata: CloudVerificationMetadata;
  verificationVisibility: CloudVerificationVisibility;
  verificationProvenance: CloudVerificationProvenance;
  verificationScope: CloudVerificationScope;
  verificationContext: CloudVerificationContext;
  verificationUnifiedEntryLink: CloudVerificationUnifiedEntryLink;
  verificationEvidenceLink: CloudVerificationEvidenceLink;
  verificationReportLink: CloudVerificationReportLink;
  verificationRuntimeLink: CloudVerificationRuntimeLink;
  verificationWorkspaceLink: CloudVerificationWorkspaceLink;
  verificationPersistentBuildLink: CloudVerificationPersistentBuildLink;
  verificationRelationships: CloudVerificationRelationships;
  createdAt: number;
  updatedAt: number;
}

export interface CloudVerificationSession {
  sessionId: string;
  verificationId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  sessionOwner: string;
  sessionState: CloudVerificationState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: CloudVerificationVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface CloudVerificationLifecycleEvent {
  eventId: string;
  verificationId: string;
  eventType: CloudVerificationLifecycleEventType;
  previousState: CloudVerificationState | null;
  newState: CloudVerificationState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface CloudVerificationHistoryEntry {
  entryId: string;
  verificationId: string;
  category:
    | 'VERIFICATION'
    | 'STATE'
    | 'OWNERSHIP'
    | 'RUNTIME'
    | 'WORKSPACE'
    | 'PERSISTENT_BUILD'
    | 'EVIDENCE'
    | 'REPORT'
    | 'UNIFIED_ENTRY'
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

export interface CloudVerificationStateHistoryEntry {
  verificationId: string;
  previousState: CloudVerificationState | null;
  newState: CloudVerificationState;
  timestamp: number;
}

export interface CloudVerificationReport {
  reportId: string;
  reportType: CloudVerificationReportType;
  generatedAt: number;
  verificationCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface CloudVerificationDiagnostics {
  cloudVerificationAuthorityActive: boolean;
  registeredVerificationCount: number;
  activeSessionCount: number;
  readyVerificationCount: number;
  waitingVerificationCount: number;
  blockedVerificationCount: number;
  duplicateRiskCount: number;
  runtimeMismatchCount: number;
  workspaceMismatchCount: number;
  buildMismatchCount: number;
  evidenceMismatchCount: number;
  reportMismatchCount: number;
  unifiedEntryMismatchCount: number;
  lastQuery: string | null;
  lastState: CloudVerificationState | null;
}

export interface CloudVerificationValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterCloudVerificationInput {
  verificationName: string;
  verificationType?: CloudVerificationCategory;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationDescription?: string;
  verificationIntent?: string;
  createdBy?: string;
  visibility?: CloudVerificationVisibility;
  query?: string;
  allowDuplicate?: boolean;
  evidenceIds?: string[];
  reportIds?: string[];
}

export interface RegisterCloudVerificationResult {
  verification: CloudVerification | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareCloudVerificationFoundationInput {
  query?: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationName?: string;
  verificationType?: CloudVerificationCategory;
  projectExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareCloudVerificationFoundationResult {
  verification: CloudVerification | null;
  session: CloudVerificationSession | null;
  reports: CloudVerificationReport[];
  diagnostics: CloudVerificationDiagnostics;
  validation: CloudVerificationValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateCloudVerificationRiskContext {
  verificationName: string;
  verificationType: CloudVerificationCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  unifiedEntrySummaries: string[];
  evidenceSummaries: string[];
  reportSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
}

export function isCloudVerificationFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return CLOUD_VERIFICATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateCloudVerificationExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_CLOUD_VERIFICATION_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidCloudVerificationStateTransition(
  from: CloudVerificationState,
  to: CloudVerificationState,
): boolean {
  const allowed: Record<CloudVerificationState, CloudVerificationState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['REQUESTED', 'WAITING_FOR_RUNTIME', 'WAITING_FOR_WORKSPACE', 'WAITING_FOR_BUILD', 'FAILED', 'ARCHIVED'],
    REQUESTED: ['IN_PROGRESS_METADATA_ONLY', 'EVIDENCE_LINKED', 'FAILED', 'ARCHIVED'],
    IN_PROGRESS_METADATA_ONLY: ['EVIDENCE_LINKED', 'REPORT_LINKED', 'FAILED', 'ARCHIVED'],
    EVIDENCE_LINKED: ['REPORT_LINKED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    REPORT_LINKED: ['COMPLETED', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_RUNTIME: ['READY', 'REQUESTED', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_WORKSPACE: ['READY', 'REQUESTED', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_BUILD: ['READY', 'REQUESTED', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'READY', 'REQUESTED'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
