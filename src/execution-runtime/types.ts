/** DevPulse V2 Execution Package Runtime — types. */

import type { ExecutionClassification, ExecutionDecision } from '../execution-authority/types.js';

export type PackageRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RuntimeState =
  | 'PACKAGE_RECEIVED'
  | 'SCHEMA_VALIDATED'
  | 'AUTHORITY_CHECKED'
  | 'ACCEPTED_READ_ONLY'
  | 'BLOCKED_REQUIRES_GATE'
  | 'REJECTED_INVALID_PACKAGE'
  | 'RUNTIME_RECORD_CREATED';

export interface ExecutionPackage {
  packageId: string;
  requestedBy: string;
  requestText: string;
  executionIntent: string;
  targetDomain: string;
  requestedAction: string;
  riskLevel: PackageRiskLevel;
  requiresWrite: boolean;
  requiresCommand: boolean;
  requiresRecovery: boolean;
  requiresAutonomy: boolean;
  metadata: Record<string, string>;
}

export interface PackageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RuntimeDecision {
  accepted: boolean;
  finalState: RuntimeState;
  classification: ExecutionClassification | 'INVALID';
  blockedReason?: string;
  futureGateRequired?: string;
  noExecutionConfirmed: boolean;
}

export interface RuntimeRecord {
  recordId: string;
  packageId: string;
  createdAt: number;
  stateSequence: RuntimeState[];
  authorityDecision: ExecutionDecision | null;
  runtimeDecision: RuntimeDecision;
  package: ExecutionPackage;
  warnings: string[];
  errors: string[];
}

export interface ExecutionPackageRuntimeState {
  runtimeId: string;
  recordCount: number;
  acceptedReadOnlyCount: number;
  blockedCount: number;
  rejectedCount: number;
  warnings: string[];
  errors: string[];
}

export interface ExecutionPackageRuntimeReport {
  ownerModule: string;
  recordCount: number;
  acceptedReadOnlyCount: number;
  blockedCount: number;
  rejectedCount: number;
  latestRecord: RuntimeRecord | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const RUNTIME_OWNER_MODULE = 'devpulse_v2_execution_package_runtime';
export const RUNTIME_PASS_TOKEN = 'DEVPULSE_V2_EXECUTION_PACKAGE_RUNTIME_V1_PASS';

export const VALID_RISK_LEVELS: readonly PackageRiskLevel[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

export const RUNTIME_FUTURE_GATE_COMMAND = 'execution_command_gate';
export const RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL = 'founder_approval_execution_gate';
export const RUNTIME_FUTURE_GATE_RECOVERY = 'recovery_execution_engine';
export const RUNTIME_FUTURE_GATE_AUTONOMY = 'world2_isolation_or_autonomy_gate';

export function mapClassificationToFutureGate(
  classification: ExecutionClassification,
): string | undefined {
  switch (classification) {
    case 'COMMAND_EXECUTION':
      return RUNTIME_FUTURE_GATE_COMMAND;
    case 'WRITE_OPERATION':
    case 'PROJECT_MODIFICATION':
      return RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL;
    case 'RECOVERY_ACTION':
      return RUNTIME_FUTURE_GATE_RECOVERY;
    case 'AUTONOMOUS_ACTION':
      return RUNTIME_FUTURE_GATE_AUTONOMY;
    default:
      return undefined;
  }
}
