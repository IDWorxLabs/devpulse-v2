/**
 * DevPulse V2 Phase 17.1 — Cloud Runtime Foundation types.
 * Cloud runtime authority only — no builds, World 2 plans, or autonomous builder execution.
 */

export const CLOUD_RUNTIME_FOUNDATION_PASS_TOKEN = 'CLOUD_RUNTIME_FOUNDATION_V1_PASS';
export const CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE = 'devpulse_v2_cloud_runtime_foundation';
export const DUPLICATE_RUNTIME_RISK_PREFIX = 'DUPLICATE_RUNTIME_RISK';

export type CloudRuntimeCategory =
  | 'GENERAL_RUNTIME'
  | 'BUILD_RUNTIME'
  | 'WORLD2_RUNTIME'
  | 'VERIFICATION_RUNTIME'
  | 'AUTONOMOUS_RUNTIME'
  | 'FOUNDER_RUNTIME'
  | 'MOBILE_RUNTIME';

export type CloudRuntimeState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'ACTIVE'
  | 'PAUSED'
  | 'RESUMABLE'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type CloudRuntimeStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'UNKNOWN';

export type CloudRuntimeVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'FOUNDER';

export type CloudRuntimeLifecycleEventType =
  | 'RUNTIME_CREATED'
  | 'RUNTIME_INITIALIZED'
  | 'RUNTIME_ACTIVATED'
  | 'RUNTIME_PAUSED'
  | 'RUNTIME_RESUMED'
  | 'RUNTIME_COMPLETED'
  | 'RUNTIME_ARCHIVED'
  | 'RUNTIME_FAILED';

export type CloudRuntimeReportType =
  | 'RUNTIME_INVENTORY_REPORT'
  | 'RUNTIME_OWNERSHIP_REPORT'
  | 'RUNTIME_LIFECYCLE_REPORT'
  | 'RUNTIME_STATE_REPORT'
  | 'RUNTIME_HISTORY_REPORT'
  | 'RUNTIME_DIAGNOSTICS_REPORT';

export const TRACKED_CLOUD_RUNTIME_CATEGORIES: readonly CloudRuntimeCategory[] = [
  'GENERAL_RUNTIME',
  'BUILD_RUNTIME',
  'WORLD2_RUNTIME',
  'VERIFICATION_RUNTIME',
  'AUTONOMOUS_RUNTIME',
  'FOUNDER_RUNTIME',
  'MOBILE_RUNTIME',
] as const;

export const FORBIDDEN_CLOUD_RUNTIME_DUPLICATES = [
  'cloud_runtime_executor',
  'cloud_execution_engine',
  'cloud_build_runner',
  'autonomous_cloud_builder',
  'world2_cloud_executor',
  'runtime_brain',
  'cloud_runtime_monolith',
] as const;

export const CLOUD_RUNTIME_QUESTION_SIGNALS = [
  'cloud runtime inventory',
  'cloud runtime state',
  'cloud runtime lifecycle',
  'cloud runtime session',
  'cloud runtime ownership',
  'cloud runtime history',
  'register cloud runtime',
  'list cloud runtimes',
  'list runtime sessions',
  'runtime inventory',
  'cloud runtime foundation',
  'cloud runtime diagnostics',
  'can runtime be resumed',
  'cloud runtime authority',
  'runtime lifecycle',
  'runtime ownership',
  'runtime sessions',
  'cloud runtime ready',
  'cloud runtime blocked',
  'cloud runtime archived',
] as const;

export interface CloudRuntimeOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  workspaceId: string;
  runtimeSessionId: string | null;
  runtimeAuthority: string;
  creationTimestamp: number;
}

export interface CloudRuntimeProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface CloudRuntimeRelationships {
  parentRuntimeId: string | null;
  childRuntimeIds: string[];
  relatedProjectIds: string[];
  relatedWorkspaceIds: string[];
}

export interface CloudRuntimeMetadata {
  runtimeName: string;
  runtimeDescription: string;
  tags: string[];
  resumable: boolean;
  monitorable: boolean;
}

export interface CloudRuntime {
  runtimeId: string;
  runtimeType: CloudRuntimeCategory;
  runtimeOwner: CloudRuntimeOwnership;
  runtimeState: CloudRuntimeState;
  runtimeStatus: CloudRuntimeStatus;
  runtimeMetadata: CloudRuntimeMetadata;
  runtimeVisibility: CloudRuntimeVisibility;
  runtimeProvenance: CloudRuntimeProvenance;
  runtimeRelationships: CloudRuntimeRelationships;
  createdAt: number;
  updatedAt: number;
}

export interface CloudRuntimeSession {
  sessionId: string;
  runtimeId: string;
  projectId: string;
  workspaceId: string;
  sessionOwner: string;
  sessionState: CloudRuntimeState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: CloudRuntimeVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface CloudRuntimeLifecycleEvent {
  eventId: string;
  runtimeId: string;
  eventType: CloudRuntimeLifecycleEventType;
  previousState: CloudRuntimeState | null;
  newState: CloudRuntimeState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface CloudRuntimeHistoryEntry {
  entryId: string;
  runtimeId: string;
  category: 'RUNTIME' | 'STATE' | 'OWNERSHIP' | 'WORKSPACE' | 'PROJECT' | 'LIFECYCLE' | 'SESSION';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface CloudRuntimeStateHistoryEntry {
  runtimeId: string;
  previousState: CloudRuntimeState | null;
  newState: CloudRuntimeState;
  timestamp: number;
}

export interface CloudRuntimeReport {
  reportId: string;
  reportType: CloudRuntimeReportType;
  generatedAt: number;
  runtimeCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface CloudRuntimeDiagnostics {
  cloudRuntimeAuthorityActive: boolean;
  registeredRuntimeCount: number;
  activeSessionCount: number;
  readyRuntimeCount: number;
  blockedRuntimeCount: number;
  duplicateRiskCount: number;
  lastQuery: string | null;
  lastState: CloudRuntimeState | null;
}

export interface CloudRuntimeValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterRuntimeInput {
  runtimeName: string;
  runtimeType?: CloudRuntimeCategory;
  projectId: string;
  workspaceId: string;
  createdBy?: string;
  runtimeDescription?: string;
  resumable?: boolean;
  monitorable?: boolean;
  visibility?: CloudRuntimeVisibility;
  allowDuplicate?: boolean;
  query?: string;
}

export interface RegisterRuntimeResult {
  runtime: CloudRuntime | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareCloudRuntimeFoundationInput {
  query?: string;
  projectId: string;
  workspaceId: string;
  runtimeName?: string;
  runtimeType?: CloudRuntimeCategory;
  projectExists: boolean;
  workspaceExists: boolean;
  ownershipValid: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareCloudRuntimeFoundationResult {
  runtime: CloudRuntime | null;
  session: CloudRuntimeSession | null;
  reports: CloudRuntimeReport[];
  diagnostics: CloudRuntimeDiagnostics;
  validation: CloudRuntimeValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateRuntimeRiskContext {
  runtimeName: string;
  runtimeType: CloudRuntimeCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
}

export function isCloudRuntimeFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  if (lower.includes('before cloud runtime') || lower.includes('focus before cloud')) return false;
  if (lower.includes('should we build cloud runtime') || lower.includes('build cloud runtime now')) return false;
  return CLOUD_RUNTIME_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateCloudRuntimeExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_CLOUD_RUNTIME_DUPLICATES.some((d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d));
}

export function isValidCloudRuntimeStateTransition(
  from: CloudRuntimeState,
  to: CloudRuntimeState,
): boolean {
  const allowed: Record<CloudRuntimeState, CloudRuntimeState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['ACTIVE', 'PAUSED', 'FAILED', 'ARCHIVED'],
    ACTIVE: ['PAUSED', 'RESUMABLE', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    PAUSED: ['RESUMABLE', 'ACTIVE', 'FAILED', 'ARCHIVED'],
    RESUMABLE: ['ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'RESUMABLE'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
