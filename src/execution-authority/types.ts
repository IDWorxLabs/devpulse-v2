/** DevPulse V2 Execution Authority — types. */

export type ExecutionClassification =
  | 'NO_EXECUTION'
  | 'READ_ONLY'
  | 'WRITE_OPERATION'
  | 'COMMAND_EXECUTION'
  | 'PROJECT_MODIFICATION'
  | 'RECOVERY_ACTION'
  | 'AUTONOMOUS_ACTION';

export interface ExecutionRequest {
  requestedBySystemId: string;
  requestText: string;
}

export interface ExecutionDecision {
  decisionId: string;
  createdAt: number;
  requestedBySystemId: string;
  classification: ExecutionClassification;
  allowed: boolean;
  reason: string;
  requiredFutureGate?: string;
  warnings: string[];
  errors: string[];
}

export interface ExecutionAuthorityState {
  authorityId: string;
  decisionCount: number;
  blockedCount: number;
  allowedReadOnlyCount: number;
  warnings: string[];
  errors: string[];
}

export interface ExecutionAuthoritySummary {
  authorityId: string;
  decisionCount: number;
  blockedCount: number;
  allowedReadOnlyCount: number;
  summary: string;
  publishedAt: number;
}

export interface ExecutionAuthorityReport {
  ownerModule: string;
  decisionCount: number;
  blockedCount: number;
  allowedReadOnlyCount: number;
  classificationDistribution: Record<ExecutionClassification, number>;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface SystemGuardrailResult {
  systemId: string;
  nonExecuting: boolean;
  violations: string[];
}

export const EXECUTION_OWNER_MODULE = 'devpulse_v2_execution_authority';
export const EXECUTION_PASS_TOKEN = 'DEVPULSE_V2_EXECUTION_AUTHORITY_FOUNDATION_V1_PASS';

export const FUTURE_GATE_COMMAND = 'execution_package_runtime';
export const FUTURE_GATE_PROJECT_MODIFICATION = 'founder_approval_execution_gate';
export const FUTURE_GATE_RECOVERY = 'recovery_execution_engine';
export const FUTURE_GATE_AUTONOMOUS = 'world2_isolation_or_autonomy_gate';
export const FUTURE_GATE_WRITE = 'founder_approval_execution_gate';
