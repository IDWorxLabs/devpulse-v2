/** DevPulse V2 World 2 Workspace Foundation — types. */

export type WorkspaceState =
  | 'WORKSPACE_DEFINED'
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_ACTIVE'
  | 'WORKSPACE_PAUSED'
  | 'WORKSPACE_ARCHIVED'
  | 'WORKSPACE_DELETED';

export type SourceWorld = 'WORLD1' | 'WORLD2';

export type WorkspaceCommunicationType =
  | 'RECOMMENDATION'
  | 'PLAN'
  | 'STATUS'
  | 'RISK_REPORT'
  | 'DIRECT_WORLD1_MODIFICATION'
  | 'GOVERNANCE_BYPASS'
  | 'WORKSPACE_TAKEOVER';

export type IsolationVerdict = 'ISOLATED' | 'BOUNDARY_VIOLATION' | 'WORLD1_PROTECTED';

export interface Workspace {
  workspaceId: string;
  projectId: string;
  projectName: string;
  projectVision: string;
  workspaceState: WorkspaceState;
  createdAt: number;
  stateSequence: WorkspaceState[];
}

export interface WorkspaceCreateInput {
  projectId: string;
  projectName: string;
  projectVision: string;
}

export interface WorkspaceNotification {
  notificationId: string;
  sourceWorld: SourceWorld;
  workspaceId: string | null;
  message: string;
  createdAt: number;
}

export interface WorkspaceBoundaryCheck {
  allowed: boolean;
  verdict: IsolationVerdict;
  reason: string;
}

export interface World2WorkspaceFoundationState {
  foundationId: string;
  workspaceCount: number;
  activeWorkspaceCount: number;
  warnings: string[];
  errors: string[];
}

export interface World2WorkspaceReport {
  ownerModule: string;
  workspaceCount: number;
  activeWorkspaceCount: number;
  isolationStatus: string;
  boundaryStatus: string;
  notificationStatus: string;
  world1ProtectionStatus: string;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const WORLD2_WORKSPACE_OWNER_MODULE = 'devpulse_v2_world2_workspace_foundation';
export const WORLD2_WORKSPACE_PASS_TOKEN = 'DEVPULSE_V2_WORLD2_WORKSPACE_FOUNDATION_V1_PASS';

export const MAX_WORKSPACES = 25;

export const WORLD1_PROTECTED_DOMAINS = [
  'law_enforcement',
  'foundation_enforcement',
  'execution_authority',
  'execution_package_runtime',
  'execution_verification_loop',
  'recovery_execution_engine',
  'founder_approval_execution_gate',
  'execution_reality_validation',
  'execution_evidence_ledger',
  'recovery_chains',
  'auto_fix_control_panel',
  'rollback_retry_engine',
  'verification_gated_apply',
] as const;

export const DEPENDENCY_SYSTEMS = [
  'law_enforcement',
  'execution_authority',
  'verification_gated_apply',
] as const;

export const DUPLICATE_PATTERNS = [
  'world2_builder',
  'workspace_manager',
  'sandbox_manager',
  'project_workspace',
  'autonomous_workspace',
] as const;
