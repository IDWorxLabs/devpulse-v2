/**
 * Workspace Isolation Expansion — types and models.
 * Isolation infrastructure only — no execution.
 */

export const WORKSPACE_ISOLATION_EXPANSION_PASS_TOKEN = 'WORKSPACE_ISOLATION_EXPANSION_V1_PASS';
export const WORKSPACE_ISOLATION_EXPANSION_OWNER_MODULE = 'devpulse_v2_workspace_isolation_expansion';

export type WorkspaceState = 'ACTIVE' | 'PAUSED' | 'LOCKED' | 'ARCHIVED';

export type WorkspaceIsolationStatus =
  | 'ISOLATED'
  | 'SHARED_AUTHORIZED'
  | 'ISOLATION_VIOLATION';

export type WorkspaceAccessResult =
  | 'ACCESS_GRANTED'
  | 'ACCESS_DENIED'
  | 'ACCESS_REQUIRES_AUTHORIZATION';

export type WorkspacePolicyDecision = 'POLICY_ALLOW' | 'POLICY_DENY' | 'POLICY_ESCALATE';

export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface WorkspaceRecord {
  workspaceId: string;
  ownerProjectId: string;
  state: WorkspaceState;
  isolationStatus: WorkspaceIsolationStatus;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceBoundary {
  workspaceId: string;
  ownerProjectId: string;
  permittedAccess: string[];
  isolationStatus: WorkspaceIsolationStatus;
  createdAt: number;
}

export interface WorkspaceAccessGrant {
  workspaceId: string;
  projectId: string;
  grantedAt: number;
}

export interface WorkspaceViolationReport {
  violationId: string;
  workspaceId: string;
  violationType: string;
  severity: ViolationSeverity;
  detail: string;
  recommendedAction: string;
  detectedAt: number;
}

export interface WorkspaceBoundaryReport {
  reportId: string;
  workspaceId: string;
  ownerProjectId: string;
  state: WorkspaceState;
  isolationStatus: WorkspaceIsolationStatus;
  authorizedAccess: string[];
  violations: WorkspaceViolationReport[];
  policyDecisions: WorkspacePolicyDecision[];
  recommendations: string[];
  generatedAt: number;
}

export interface RegisterWorkspaceInput {
  workspaceId: string;
  ownerProjectId: string;
}

export interface WorkspaceRuntimeReport {
  workspaceCount: number;
  registrySize: number;
  violationCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const WORKSPACE_ISOLATION_QUESTION_SIGNALS = [
  'workspace isolation',
  'workspace boundary',
  'workspace access',
  'isolation violation',
  'workspace ownership',
] as const;

export function isWorkspaceIsolationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return WORKSPACE_ISOLATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
