/**
 * DevPulse V2 Phase 17.6 — Cloud Monitoring Foundation types.
 * Monitoring authority only — no real infrastructure polling, notifications, or execution.
 */

export const CLOUD_MONITORING_FOUNDATION_PASS_TOKEN = 'CLOUD_MONITORING_FOUNDATION_V1_PASS';
export const CLOUD_MONITORING_FOUNDATION_OWNER_MODULE = 'devpulse_v2_cloud_monitoring_foundation';
export const DUPLICATE_CLOUD_MONITORING_RISK_PREFIX = 'DUPLICATE_CLOUD_MONITORING_RISK';

export type CloudMonitoringCategory =
  | 'GENERAL_MONITORING'
  | 'RUNTIME_MONITORING'
  | 'WORKSPACE_MONITORING'
  | 'BUILD_MONITORING'
  | 'VERIFICATION_MONITORING'
  | 'RECOVERY_MONITORING'
  | 'WORLD2_MONITORING'
  | 'AUTONOMOUS_MONITORING'
  | 'MOBILE_MONITORING';

export type CloudMonitoringState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'MONITORING_ACTIVE'
  | 'HEALTH_UPDATED'
  | 'ALERT_CREATED'
  | 'ALERT_ACKNOWLEDGED'
  | 'WAITING_FOR_RUNTIME'
  | 'WAITING_FOR_WORKSPACE'
  | 'WAITING_FOR_BUILD'
  | 'WAITING_FOR_VERIFICATION'
  | 'WAITING_FOR_RECOVERY'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type CloudMonitoringStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export type CloudMonitoringVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'FOUNDER';

export type MonitoringHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

export type MonitoringAlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type MonitoringAlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ARCHIVED';

export type CloudMonitoringLifecycleEventType =
  | 'MONITORING_CREATED'
  | 'MONITORING_INITIALIZED'
  | 'MONITORING_ACTIVATED'
  | 'HEALTH_UPDATED'
  | 'ALERT_CREATED'
  | 'ALERT_ACKNOWLEDGED'
  | 'MONITORING_LINKED_TO_RUNTIME'
  | 'MONITORING_LINKED_TO_WORKSPACE'
  | 'MONITORING_LINKED_TO_BUILD'
  | 'MONITORING_LINKED_TO_VERIFICATION'
  | 'MONITORING_LINKED_TO_RECOVERY'
  | 'MONITORING_COMPLETED'
  | 'MONITORING_ARCHIVED'
  | 'MONITORING_FAILED';

export type CloudMonitoringReportType =
  | 'CLOUD_MONITORING_INVENTORY_REPORT'
  | 'CLOUD_MONITORING_HEALTH_REPORT'
  | 'CLOUD_MONITORING_ALERT_REPORT'
  | 'CLOUD_MONITORING_LIFECYCLE_REPORT'
  | 'CLOUD_MONITORING_CONTEXT_REPORT'
  | 'CLOUD_MONITORING_RUNTIME_REPORT'
  | 'CLOUD_MONITORING_WORKSPACE_REPORT'
  | 'CLOUD_MONITORING_BUILD_REPORT'
  | 'CLOUD_MONITORING_VERIFICATION_REPORT'
  | 'CLOUD_MONITORING_RECOVERY_REPORT'
  | 'CLOUD_MONITORING_HISTORY_REPORT'
  | 'CLOUD_MONITORING_DIAGNOSTICS_REPORT';

export const TRACKED_CLOUD_MONITORING_CATEGORIES: readonly CloudMonitoringCategory[] = [
  'GENERAL_MONITORING',
  'RUNTIME_MONITORING',
  'WORKSPACE_MONITORING',
  'BUILD_MONITORING',
  'VERIFICATION_MONITORING',
  'RECOVERY_MONITORING',
  'WORLD2_MONITORING',
  'AUTONOMOUS_MONITORING',
  'MOBILE_MONITORING',
] as const;

export const FORBIDDEN_CLOUD_MONITORING_DUPLICATES = [
  'cloud_monitoring_executor',
  'cloud_monitoring_worker',
  'cloud_monitoring_monolith',
  'parallel_cloud_monitoring_authority',
  'monitoring_runner_engine',
  'auto_monitoring_engine',
] as const;

export const CLOUD_MONITORING_QUESTION_SIGNALS = [
  'cloud monitoring',
  'monitoring health',
  'monitoring alert',
  'monitoring alerts',
  'monitoring session',
  'monitoring state',
  'monitoring context',
  'monitoring foundation',
  'monitoring inventory',
  'register monitoring',
  'list monitoring',
  'monitoring runtime link',
  'monitoring workspace link',
  'monitoring build link',
  'monitoring verification link',
  'monitoring recovery link',
  'monitoring diagnostics',
  'monitoring ownership',
  'monitoring lifecycle',
  'monitoring history',
  'health updated',
  'alert created',
  'alert acknowledged',
  'monitoring active',
  'what cloud resources are being monitored',
] as const;

export interface CloudMonitoringOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringSessionId: string | null;
  monitoringAuthority: string;
  creationTimestamp: number;
}

export interface CloudMonitoringProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface CloudMonitoringHealth {
  healthStatus: MonitoringHealthStatus;
  healthScore: number;
  healthCategory: string;
  lastHealthUpdate: number;
  healthEvidence: string[];
  healthReferences: string[];
}

export interface CloudMonitoringAlert {
  alertId: string;
  monitoringId: string;
  alertType: string;
  alertSeverity: MonitoringAlertSeverity;
  alertCategory: string;
  alertSource: string;
  alertTimestamp: number;
  alertStatus: MonitoringAlertStatus;
  alertReferences: string[];
}

export interface CloudMonitoringContext {
  contextSummary: string;
  runtimeSummary: string | null;
  workspaceSummary: string | null;
  persistentBuildSummary: string | null;
  verificationSummary: string | null;
  recoverySummary: string | null;
  healthSummary: string | null;
  alertSummary: string | null;
  vaultSummaries: string[];
  brainSummaries: string[];
  knownConstraints: string[];
}

export interface CloudMonitoringRuntimeLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudMonitoringWorkspaceLink {
  workspaceId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudMonitoringBuildLink {
  persistentBuildId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudMonitoringVerificationLink {
  verificationId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudMonitoringRecoveryLink {
  recoveryId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface CloudMonitoringRelationships {
  parentMonitoringId: string | null;
  childMonitoringIds: string[];
  relatedRuntimeIds: string[];
  relatedWorkspaceIds: string[];
  relatedPersistentBuildIds: string[];
  relatedVerificationIds: string[];
  relatedRecoveryIds: string[];
  relatedProjectIds: string[];
}

export interface CloudMonitoringMetadata {
  monitoringName: string;
  monitoringDescription: string;
  tags: string[];
  monitorable: boolean;
}

export interface CloudMonitoringRecord {
  monitoringId: string;
  monitoringType: CloudMonitoringCategory;
  monitoringOwner: CloudMonitoringOwnership;
  monitoringState: CloudMonitoringState;
  monitoringStatus: CloudMonitoringStatus;
  monitoringMetadata: CloudMonitoringMetadata;
  monitoringVisibility: CloudMonitoringVisibility;
  monitoringProvenance: CloudMonitoringProvenance;
  monitoringContext: CloudMonitoringContext;
  monitoringHealth: CloudMonitoringHealth;
  monitoringAlerts: CloudMonitoringAlert[];
  monitoringRuntimeLink: CloudMonitoringRuntimeLink;
  monitoringWorkspaceLink: CloudMonitoringWorkspaceLink;
  monitoringBuildLink: CloudMonitoringBuildLink;
  monitoringVerificationLink: CloudMonitoringVerificationLink;
  monitoringRecoveryLink: CloudMonitoringRecoveryLink;
  monitoringRelationships: CloudMonitoringRelationships;
  createdAt: number;
  updatedAt: number;
}

export interface CloudMonitoringSession {
  sessionId: string;
  monitoringId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  sessionOwner: string;
  sessionState: CloudMonitoringState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: CloudMonitoringVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface CloudMonitoringLifecycleEvent {
  eventId: string;
  monitoringId: string;
  eventType: CloudMonitoringLifecycleEventType;
  previousState: CloudMonitoringState | null;
  newState: CloudMonitoringState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface CloudMonitoringHistoryEntry {
  entryId: string;
  monitoringId: string;
  category:
    | 'MONITORING'
    | 'HEALTH'
    | 'ALERT'
    | 'STATE'
    | 'OWNERSHIP'
    | 'RUNTIME'
    | 'WORKSPACE'
    | 'PERSISTENT_BUILD'
    | 'VERIFICATION'
    | 'RECOVERY'
    | 'PROJECT'
    | 'CONTEXT'
    | 'LIFECYCLE'
    | 'SESSION';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface CloudMonitoringStateHistoryEntry {
  monitoringId: string;
  previousState: CloudMonitoringState | null;
  newState: CloudMonitoringState;
  timestamp: number;
}

export interface CloudMonitoringReport {
  reportId: string;
  reportType: CloudMonitoringReportType;
  generatedAt: number;
  monitoringCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface CloudMonitoringDiagnostics {
  cloudMonitoringAuthorityActive: boolean;
  registeredMonitoringCount: number;
  activeSessionCount: number;
  activeMonitoringCount: number;
  healthUpdatedCount: number;
  openAlertCount: number;
  blockedMonitoringCount: number;
  duplicateRiskCount: number;
  runtimeMismatchCount: number;
  workspaceMismatchCount: number;
  buildMismatchCount: number;
  verificationMismatchCount: number;
  recoveryMismatchCount: number;
  lastQuery: string | null;
  lastState: CloudMonitoringState | null;
}

export interface CloudMonitoringValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterMonitoringInput {
  monitoringName: string;
  monitoringType?: CloudMonitoringCategory;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringDescription?: string;
  createdBy?: string;
  visibility?: CloudMonitoringVisibility;
  query?: string;
  allowDuplicate?: boolean;
}

export interface RegisterMonitoringResult {
  record: CloudMonitoringRecord | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareCloudMonitoringFoundationInput {
  query?: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringName?: string;
  monitoringType?: CloudMonitoringCategory;
  projectExists?: boolean;
  runtimeExists?: boolean;
  workspaceExists?: boolean;
  persistentBuildExists?: boolean;
  verificationExists?: boolean;
  recoveryExists?: boolean;
  ownershipValid?: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareCloudMonitoringFoundationResult {
  record: CloudMonitoringRecord | null;
  session: CloudMonitoringSession | null;
  reports: CloudMonitoringReport[];
  diagnostics: CloudMonitoringDiagnostics;
  validation: CloudMonitoringValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateCloudMonitoringRiskContext {
  monitoringName: string;
  monitoringType: CloudMonitoringCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  runtimeSummaries: string[];
  workspaceSummaries: string[];
  persistentBuildSummaries: string[];
  verificationSummaries: string[];
  recoverySummaries: string[];
}

export function isCloudMonitoringFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return CLOUD_MONITORING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateCloudMonitoringExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_CLOUD_MONITORING_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidCloudMonitoringStateTransition(
  from: CloudMonitoringState,
  to: CloudMonitoringState,
): boolean {
  const allowed: Record<CloudMonitoringState, CloudMonitoringState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['MONITORING_ACTIVE', 'WAITING_FOR_RUNTIME', 'WAITING_FOR_WORKSPACE', 'WAITING_FOR_BUILD', 'WAITING_FOR_VERIFICATION', 'WAITING_FOR_RECOVERY', 'FAILED', 'ARCHIVED'],
    MONITORING_ACTIVE: ['HEALTH_UPDATED', 'ALERT_CREATED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    HEALTH_UPDATED: ['MONITORING_ACTIVE', 'ALERT_CREATED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    ALERT_CREATED: ['ALERT_ACKNOWLEDGED', 'MONITORING_ACTIVE', 'FAILED', 'ARCHIVED'],
    ALERT_ACKNOWLEDGED: ['MONITORING_ACTIVE', 'HEALTH_UPDATED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_RUNTIME: ['READY', 'MONITORING_ACTIVE', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_WORKSPACE: ['READY', 'MONITORING_ACTIVE', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_BUILD: ['READY', 'MONITORING_ACTIVE', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_VERIFICATION: ['READY', 'MONITORING_ACTIVE', 'FAILED', 'ARCHIVED'],
    WAITING_FOR_RECOVERY: ['READY', 'MONITORING_ACTIVE', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'READY', 'MONITORING_ACTIVE'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
