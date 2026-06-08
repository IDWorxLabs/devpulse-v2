/** DevPulse V2 Recovery Chains — types. */

import type { RuntimeRecord } from '../execution-runtime/types.js';
import type { ExecutionVerificationResult } from '../execution-verification/types.js';
import type { RecoveryRecord } from '../recovery-execution/types.js';
import type { FounderApprovalRecord } from '../founder-approval-execution/types.js';
import type { ExecutionRealityResult } from '../execution-reality-validation/types.js';
import type { ExecutionEvidenceLedgerRecord } from '../execution-evidence-ledger/types.js';

export type RecoveryStepType =
  | 'INVESTIGATE'
  | 'VERIFY'
  | 'REQUEST_APPROVAL'
  | 'WAIT_FOR_GATE'
  | 'RETRY'
  | 'ROLLBACK'
  | 'MONITOR'
  | 'ESCALATE';

export type ChainState =
  | 'CHAIN_INPUT_RECEIVED'
  | 'FAILURE_ANALYZED'
  | 'CHAIN_GENERATED'
  | 'CHAIN_VALIDATED'
  | 'RISK_EVALUATED'
  | 'EVIDENCE_ATTACHED'
  | 'CHAIN_READY';

export type ChainRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FailureType =
  | 'MISSING_RUNTIME'
  | 'MISSING_APPROVAL'
  | 'FAILED_VERIFICATION'
  | 'WRONG_GATE_MAPPING'
  | 'AUTONOMY_FAILURE'
  | 'MONITOR_ONLY';

export type RecoveryEvidenceSource =
  | 'verification'
  | 'recovery'
  | 'approval'
  | 'reality'
  | 'ledger';

export interface RecoveryStep {
  stepId: string;
  order: number;
  stepType: RecoveryStepType;
  description: string;
  requiresApproval: boolean;
  requiresVerification: boolean;
  requiresRetry: boolean;
  requiresRollback: boolean;
}

export interface RecoveryChainEvidenceLink {
  linkId: string;
  source: RecoveryEvidenceSource;
  referenceId: string;
  systemId: string;
}

export interface RecoveryChainGovernanceContext {
  packageId: string;
  failureType?: FailureType;
  failureReason?: string;
  rollbackRequired?: boolean;
  runtimeRecord: RuntimeRecord | null;
  verificationResult: ExecutionVerificationResult | null;
  recoveryRecord: RecoveryRecord | null;
  approvalRecord: FounderApprovalRecord | null;
  realityResult: ExecutionRealityResult | null;
  ledgerRecord: ExecutionEvidenceLedgerRecord | null;
}

export interface RecoveryChain {
  chainId: string;
  packageId: string;
  failureReason: string;
  failureType: FailureType;
  recoverySteps: RecoveryStep[];
  riskLevel: ChainRiskLevel;
  approvalRequired: boolean;
  verificationRequired: boolean;
  rollbackRequired: boolean;
  retryRequired: boolean;
  evidenceLinks: RecoveryChainEvidenceLink[];
  stateSequence: ChainState[];
  createdAt: number;
  planningOnlyConfirmed: boolean;
  noRecoveryExecuted: boolean;
}

export interface RecoveryChainsState {
  chainsId: string;
  chainCount: number;
  warnings: string[];
  errors: string[];
}

export interface RecoveryChainReport {
  ownerModule: string;
  chainCount: number;
  latestChain: RecoveryChain | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const RECOVERY_CHAINS_OWNER_MODULE = 'devpulse_v2_recovery_chains';
export const RECOVERY_CHAINS_PASS_TOKEN = 'DEVPULSE_V2_RECOVERY_CHAINS_V1_PASS';

export const DEPENDENCY_SYSTEMS = [
  'recovery_execution_engine',
  'founder_approval_execution_gate',
  'execution_reality_validation',
  'execution_evidence_ledger',
] as const;
