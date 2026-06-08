/** DevPulse V2 Rollback & Retry Engine — types. */

import type { ChainRiskLevel } from '../recovery-chains/types.js';
import type { FounderApprovalRecord } from '../founder-approval-execution/types.js';
import type { ExecutionRealityResult } from '../execution-reality-validation/types.js';
import type { ExecutionEvidenceLedgerRecord } from '../execution-evidence-ledger/types.js';
import type { RecoveryChain } from '../recovery-chains/types.js';
import type { AutoFixPermissionRecord } from '../auto-fix-control/types.js';
import type { RuntimeRecord } from '../execution-runtime/types.js';
import type { ExecutionVerificationResult } from '../execution-verification/types.js';

export type RollbackState = 'ROLLBACK_NOT_REQUIRED' | 'ROLLBACK_RECOMMENDED' | 'ROLLBACK_REQUIRED';

export type RetryState = 'RETRY_NOT_REQUIRED' | 'RETRY_RECOMMENDED' | 'RETRY_REQUIRED';

export type EngineState =
  | 'INPUT_RECEIVED'
  | 'FAILURE_CLASSIFIED'
  | 'CHECKPOINT_SELECTED'
  | 'ROLLBACK_EVALUATED'
  | 'RETRY_EVALUATED'
  | 'POLICY_CHECK_COMPLETED'
  | 'EVIDENCE_ATTACHED'
  | 'PLAN_CREATED';

export type FailureScenario =
  | 'MISSING_RUNTIME'
  | 'MISSING_VERIFICATION'
  | 'WRONG_GATE_MAPPING'
  | 'CONTRADICTION_PRESENT'
  | 'FAILED_REALITY_VALIDATION'
  | 'APPROVAL_MISSING'
  | 'AUTONOMY_FAILURE'
  | 'NONE';

export type CheckpointType =
  | 'GOVERNANCE_CHAIN_START'
  | 'PRE_FAILURE'
  | 'LAST_TRUSTED_VERIFICATION'
  | 'APPROVAL_GATE'
  | 'REALITY_VALIDATION';

export type CheckpointConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type RollbackRetryEvidenceSource =
  | 'recovery_chains'
  | 'auto_fix_control'
  | 'approval'
  | 'reality'
  | 'ledger';

export interface Checkpoint {
  checkpointId: string;
  checkpointType: CheckpointType;
  checkpointReason: string;
  confidence: CheckpointConfidence;
  packageId: string;
}

export interface RollbackRetryEvidenceLink {
  linkId: string;
  source: RollbackRetryEvidenceSource;
  referenceId: string;
  systemId: string;
}

export interface RollbackRetryPlanInput {
  packageId: string;
  failureScenario?: FailureScenario;
  runtimeRecord?: RuntimeRecord | null;
  verificationResult?: ExecutionVerificationResult | null;
  recoveryChain?: RecoveryChain | null;
  autoFixRecord?: AutoFixPermissionRecord | null;
  approvalRecord?: FounderApprovalRecord | null;
  realityResult?: ExecutionRealityResult | null;
  ledgerRecord?: ExecutionEvidenceLedgerRecord | null;
}

export interface RollbackRetryPlan {
  planId: string;
  packageId: string;
  failureScenario: FailureScenario;
  rollbackState: RollbackState;
  retryState: RetryState;
  checkpoint: Checkpoint;
  approvalRequired: boolean;
  verificationRequired: boolean;
  riskLevel: ChainRiskLevel;
  evidenceLinks: RollbackRetryEvidenceLink[];
  stateSequence: EngineState[];
  createdAt: number;
  planningOnlyConfirmed: boolean;
  noRollbackExecuted: boolean;
  noRetryExecuted: boolean;
}

export interface RollbackRetryEngineState {
  engineId: string;
  planCount: number;
  warnings: string[];
  errors: string[];
}

export interface RollbackRetryReport {
  ownerModule: string;
  planCount: number;
  latestPlan: RollbackRetryPlan | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const ROLLBACK_RETRY_ENGINE_OWNER_MODULE = 'devpulse_v2_rollback_retry_engine';
export const ROLLBACK_RETRY_ENGINE_PASS_TOKEN = 'DEVPULSE_V2_ROLLBACK_RETRY_ENGINE_V1_PASS';

export const DEPENDENCY_SYSTEMS = [
  'recovery_chains',
  'auto_fix_control_panel',
  'founder_approval_execution_gate',
  'execution_reality_validation',
  'execution_evidence_ledger',
] as const;

export const DUPLICATE_PATTERNS = [
  'rollback_engine',
  'retry_engine',
  'checkpoint_restore',
  'automatic_retry',
  'rollback_strategy',
] as const;
