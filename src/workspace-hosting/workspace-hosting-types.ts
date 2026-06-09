/**
 * DevPulse V2 Phase 17.2 — Workspace Hosting Foundation types.
 * Hosted workspace authority only — no builds, cloud workers, or real app deployment.
 */

export const WORKSPACE_HOSTING_FOUNDATION_PASS_TOKEN = 'WORKSPACE_HOSTING_FOUNDATION_V1_PASS';
export const WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE = 'devpulse_v2_workspace_hosting_foundation';
export const DUPLICATE_WORKSPACE_RISK_PREFIX = 'DUPLICATE_WORKSPACE_RISK';

export type WorkspaceCategory =
  | 'GENERAL_WORKSPACE'
  | 'BUILD_WORKSPACE'
  | 'WORLD2_WORKSPACE'
  | 'VERIFICATION_WORKSPACE'
  | 'AUTONOMOUS_WORKSPACE'
  | 'FOUNDER_WORKSPACE'
  | 'MOBILE_WORKSPACE'
  | 'SANDBOX_WORKSPACE';

export type WorkspaceState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'ACTIVE'
  | 'PAUSED'
  | 'RESUMABLE'
  | 'ISOLATED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export type WorkspaceStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'ISOLATED' | 'UNKNOWN';

export type WorkspaceVisibility = 'PRIVATE' | 'PROJECT' | 'RUNTIME' | 'FOUNDER';

export type WorkspaceIsolationMode = 'NONE' | 'PROJECT_BOUND' | 'RUNTIME_BOUND' | 'SANDBOX' | 'STRICT';

export type WorkspaceLifecycleEventType =
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_INITIALIZED'
  | 'WORKSPACE_ACTIVATED'
  | 'WORKSPACE_ISOLATED'
  | 'WORKSPACE_PAUSED'
  | 'WORKSPACE_RESUMED'
  | 'WORKSPACE_COMPLETED'
  | 'WORKSPACE_ARCHIVED'
  | 'WORKSPACE_FAILED'
  | 'WORKSPACE_LINKED_TO_RUNTIME';

export type WorkspaceReportType =
  | 'WORKSPACE_INVENTORY_REPORT'
  | 'WORKSPACE_OWNERSHIP_REPORT'
  | 'WORKSPACE_LIFECYCLE_REPORT'
  | 'WORKSPACE_STATE_REPORT'
  | 'WORKSPACE_ISOLATION_REPORT'
  | 'WORKSPACE_RUNTIME_LINK_REPORT'
  | 'WORKSPACE_HISTORY_REPORT'
  | 'WORKSPACE_DIAGNOSTICS_REPORT';

export const TRACKED_WORKSPACE_CATEGORIES: readonly WorkspaceCategory[] = [
  'GENERAL_WORKSPACE',
  'BUILD_WORKSPACE',
  'WORLD2_WORKSPACE',
  'VERIFICATION_WORKSPACE',
  'AUTONOMOUS_WORKSPACE',
  'FOUNDER_WORKSPACE',
  'MOBILE_WORKSPACE',
  'SANDBOX_WORKSPACE',
] as const;

export const FORBIDDEN_WORKSPACE_HOSTING_DUPLICATES = [
  'workspace_hosting_executor',
  'hosted_workspace_engine',
  'cloud_workspace_runner',
  'workspace_container_engine',
  'workspace_hosting_monolith',
  'parallel_workspace_authority',
] as const;

export const WORKSPACE_HOSTING_QUESTION_SIGNALS = [
  'workspace hosting',
  'hosted workspace',
  'hosted workspaces',
  'workspace inventory',
  'workspace lifecycle',
  'workspace state',
  'workspace session',
  'workspace ownership',
  'workspace isolation',
  'workspace runtime link',
  'register hosted workspace',
  'list hosted workspaces',
  'list workspace sessions',
  'workspace hosting foundation',
  'workspace diagnostics',
  'can workspace be resumed',
  'can workspace be isolated',
  'workspace hosting authority',
  'workspace linked to runtime',
  'workspace ready',
  'workspace blocked',
  'workspace archived',
] as const;

export interface WorkspaceOwnership {
  ownerModule: string;
  ownerDomain: string;
  createdBy: string;
  projectId: string;
  runtimeId: string;
  workspaceSessionId: string | null;
  workspaceAuthority: string;
  creationTimestamp: number;
}

export interface WorkspaceProvenance {
  sourceSystem: string;
  registeredBy: string;
  registrationQuery: string | null;
}

export interface WorkspaceIsolation {
  isolationMode: WorkspaceIsolationMode;
  isolationBoundary: string;
  allowedRuntimeIds: string[];
  allowedProjectIds: string[];
  allowedSessionIds: string[];
  disposableWorkspace: boolean;
  stableWorkspaceProtected: boolean;
  crossProjectAccessBlocked: boolean;
}

export interface WorkspaceRuntimeLink {
  runtimeId: string;
  linkedAt: number;
  linkAuthority: string;
  mismatchDetected: boolean;
}

export interface WorkspaceProjectLink {
  projectId: string;
  linkedAt: number;
  linkAuthority: string;
}

export interface WorkspaceVerificationLink {
  evidenceReferences: string[];
  reportReferences: string[];
  linkedAt: number;
}

export interface WorkspaceRelationships {
  parentWorkspaceId: string | null;
  childWorkspaceIds: string[];
  relatedRuntimeIds: string[];
  relatedProjectIds: string[];
}

export interface WorkspaceMetadata {
  workspaceName: string;
  workspaceDescription: string;
  tags: string[];
  resumable: boolean;
  isolatable: boolean;
  monitorable: boolean;
}

export interface HostedWorkspace {
  workspaceId: string;
  workspaceType: WorkspaceCategory;
  workspaceOwner: WorkspaceOwnership;
  workspaceState: WorkspaceState;
  workspaceStatus: WorkspaceStatus;
  workspaceMetadata: WorkspaceMetadata;
  workspaceVisibility: WorkspaceVisibility;
  workspaceProvenance: WorkspaceProvenance;
  workspaceIsolation: WorkspaceIsolation;
  workspaceRuntimeLink: WorkspaceRuntimeLink;
  workspaceProjectLink: WorkspaceProjectLink;
  workspaceVerificationLink: WorkspaceVerificationLink;
  workspaceRelationships: WorkspaceRelationships;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceSession {
  sessionId: string;
  workspaceId: string;
  projectId: string;
  runtimeId: string;
  sessionOwner: string;
  sessionState: WorkspaceState;
  sessionMetadata: Record<string, string>;
  sessionVisibility: WorkspaceVisibility;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceLifecycleEvent {
  eventId: string;
  workspaceId: string;
  eventType: WorkspaceLifecycleEventType;
  previousState: WorkspaceState | null;
  newState: WorkspaceState;
  timestamp: number;
  sourceModule: string;
  notes: string;
}

export interface WorkspaceHistoryEntry {
  entryId: string;
  workspaceId: string;
  category: 'WORKSPACE' | 'STATE' | 'OWNERSHIP' | 'RUNTIME' | 'PROJECT' | 'ISOLATION' | 'LIFECYCLE' | 'SESSION';
  summary: string;
  timestamp: number;
  consumer: string | null;
  scopeUsed: string | null;
}

export interface WorkspaceStateHistoryEntry {
  workspaceId: string;
  previousState: WorkspaceState | null;
  newState: WorkspaceState;
  timestamp: number;
}

export interface WorkspaceReport {
  reportId: string;
  reportType: WorkspaceReportType;
  generatedAt: number;
  workspaceCount: number;
  sessionCount: number;
  summary: string;
  findings: string[];
  managementOnly: true;
}

export interface WorkspaceHostingDiagnostics {
  workspaceHostingAuthorityActive: boolean;
  registeredWorkspaceCount: number;
  activeSessionCount: number;
  readyWorkspaceCount: number;
  isolatedWorkspaceCount: number;
  blockedWorkspaceCount: number;
  duplicateRiskCount: number;
  runtimeMismatchCount: number;
  lastQuery: string | null;
  lastState: WorkspaceState | null;
}

export interface WorkspaceValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  duplicateRisks: string[];
}

export interface RegisterWorkspaceInput {
  workspaceName: string;
  workspaceType?: WorkspaceCategory;
  projectId: string;
  runtimeId: string;
  createdBy?: string;
  workspaceDescription?: string;
  resumable?: boolean;
  isolatable?: boolean;
  monitorable?: boolean;
  visibility?: WorkspaceVisibility;
  isolationMode?: WorkspaceIsolationMode;
  allowDuplicate?: boolean;
  query?: string;
  evidenceReferences?: string[];
  reportReferences?: string[];
}

export interface RegisterWorkspaceResult {
  workspace: HostedWorkspace | null;
  duplicate: boolean;
  duplicateRisks: string[];
  blocked: boolean;
}

export interface PrepareWorkspaceHostingFoundationInput {
  query?: string;
  projectId: string;
  runtimeId: string;
  workspaceName?: string;
  workspaceType?: WorkspaceCategory;
  projectExists: boolean;
  runtimeExists: boolean;
  ownershipValid: boolean;
  forceDuplicate?: boolean;
}

export interface PrepareWorkspaceHostingFoundationResult {
  workspace: HostedWorkspace | null;
  session: WorkspaceSession | null;
  reports: WorkspaceReport[];
  diagnostics: WorkspaceHostingDiagnostics;
  validation: WorkspaceValidationResult;
  responseText: string;
  authorityOnly: true;
}

export interface DuplicateWorkspaceRiskContext {
  workspaceName: string;
  workspaceType: WorkspaceCategory;
  ownershipDomains: string[];
  capabilityIds: string[];
  vaultSummaries: string[];
  brainSummaries: string[];
  runtimeSummaries: string[];
}

export function isWorkspaceHostingFoundationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return WORKSPACE_HOSTING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateWorkspaceHostingExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_WORKSPACE_HOSTING_DUPLICATES.some(
    (d) => lower.includes(d.replace(/_/g, ' ')) || lower.includes(d),
  );
}

export function isValidWorkspaceStateTransition(from: WorkspaceState, to: WorkspaceState): boolean {
  const allowed: Record<WorkspaceState, WorkspaceState[]> = {
    CREATED: ['INITIALIZING', 'FAILED', 'ARCHIVED'],
    INITIALIZING: ['READY', 'FAILED', 'ARCHIVED'],
    READY: ['ACTIVE', 'ISOLATED', 'PAUSED', 'FAILED', 'ARCHIVED'],
    ACTIVE: ['PAUSED', 'RESUMABLE', 'ISOLATED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    PAUSED: ['RESUMABLE', 'ACTIVE', 'ISOLATED', 'FAILED', 'ARCHIVED'],
    RESUMABLE: ['ACTIVE', 'PAUSED', 'ISOLATED', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    ISOLATED: ['ACTIVE', 'PAUSED', 'RESUMABLE', 'FAILED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    FAILED: ['ARCHIVED', 'RESUMABLE'],
    ARCHIVED: [],
  };
  return allowed[from]?.includes(to) ?? false;
}
