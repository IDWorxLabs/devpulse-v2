/** DevPulse V2 Recovery Execution Engine — types. */

import type { ExecutionVerificationResult } from '../execution-verification/types.js';

export type RecoveryState =
  | 'RECOVERY_INPUT_RECEIVED'
  | 'VERIFICATION_RESULT_READ'
  | 'RECOVERY_NEED_CLASSIFIED'
  | 'RECOVERY_STRATEGY_SELECTED'
  | 'RECOVERY_GATES_CHECKED'
  | 'RECOVERY_PLAN_CREATED'
  | 'RECOVERY_BLOCKED_PENDING_GATE'
  | 'RECOVERY_NOT_REQUIRED'
  | 'RECOVERY_RECORD_CREATED';

export type RecoveryNeedType =
  | 'NO_RECOVERY_REQUIRED'
  | 'WARNING_MONITOR_ONLY'
  | 'FAILED_NEEDS_RECOVERY_PLAN'
  | 'BLOCKED_REQUIRES_FUTURE_GATE'
  | 'INVALID_INPUT';

export type RecoveryStrategyType =
  | 'NONE'
  | 'MONITOR'
  | 'RETRY_AFTER_GATE'
  | 'ROLLBACK_AND_RETRY_AFTER_GATE'
  | 'FOUNDER_REVIEW_REQUIRED'
  | 'WORLD2_ISOLATION_REQUIRED'
  | 'MANUAL_INVESTIGATION_REQUIRED';

export interface RecoveryPlan {
  recoveryPlanId: string;
  verificationId: string;
  packageId: string;
  createdAt: number;
  verificationVerdict: ExecutionVerificationResult['verdict'];
  recoveryNeed: RecoveryNeedType;
  strategy: RecoveryStrategyType;
  requiredGate?: string;
  rollbackRequired: boolean;
  retryAllowed: boolean;
  founderApprovalRequired: boolean;
  summary: string;
  warnings: string[];
  errors: string[];
}

export interface RecoveryRecord {
  recordId: string;
  plan: RecoveryPlan;
  stateSequence: RecoveryState[];
  verificationResult: ExecutionVerificationResult;
  noRecoveryExecuted: boolean;
}

export interface RecoveryExecutionEngineState {
  engineId: string;
  planCount: number;
  noRecoveryCount: number;
  blockedPendingGateCount: number;
  recoveryPlanCount: number;
  warnings: string[];
  errors: string[];
}

export interface RecoveryExecutionReport {
  ownerModule: string;
  planCount: number;
  latestRecord: RecoveryRecord | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const RECOVERY_EXECUTION_OWNER_MODULE = 'devpulse_v2_recovery_execution_engine';
export const RECOVERY_EXECUTION_PASS_TOKEN = 'DEVPULSE_V2_RECOVERY_EXECUTION_ENGINE_V1_PASS';

export const GATE_EXECUTION_COMMAND = 'execution_command_gate';
export const GATE_FOUNDER_APPROVAL = 'founder_approval_execution_gate';
export const GATE_RECOVERY_EXECUTION = 'recovery_execution_gate';
export const GATE_WORLD2_AUTONOMY = 'world2_isolation_or_autonomy_gate';

export const DEPENDENCY_SYSTEMS = [
  'execution_authority',
  'execution_package_runtime',
  'execution_verification_loop',
] as const;
