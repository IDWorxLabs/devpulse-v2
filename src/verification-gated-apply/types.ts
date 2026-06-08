/** DevPulse V2 Verification-Gated Apply — types. */

import type { ChainRiskLevel } from '../recovery-chains/types.js';
import type { ExecutionVerificationResult } from '../execution-verification/types.js';
import type { FounderApprovalRecord } from '../founder-approval-execution/types.js';
import type { ExecutionRealityResult } from '../execution-reality-validation/types.js';
import type { ExecutionEvidenceLedgerRecord } from '../execution-evidence-ledger/types.js';
import type { RecoveryChain } from '../recovery-chains/types.js';
import type { AutoFixPermissionRecord } from '../auto-fix-control/types.js';
import type { RollbackRetryPlan } from '../rollback-retry-engine/types.js';

export type ApplyState =
  | 'APPLY_INPUT_RECEIVED'
  | 'READINESS_EVALUATED'
  | 'POLICY_CHECK_COMPLETED'
  | 'RISK_EVALUATED'
  | 'EVIDENCE_ATTACHED'
  | 'APPLY_ALLOWED'
  | 'APPLY_BLOCKED'
  | 'APPLY_PENDING_APPROVAL'
  | 'APPLY_RECORD_CREATED';

export type ReadinessState = 'READY' | 'NOT_READY' | 'PENDING_APPROVAL';

export type ApplyVerdict = 'ALLOW' | 'BLOCK' | 'PENDING';

export type ApplyRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ApplyEvidenceSource =
  | 'reality'
  | 'ledger'
  | 'recovery_chains'
  | 'auto_fix_control'
  | 'rollback_retry_engine';

export interface ApplyEvidenceLink {
  linkId: string;
  source: ApplyEvidenceSource;
  referenceId: string;
  systemId: string;
}

export interface ApplyGateInput {
  packageId: string;
  verificationResult?: ExecutionVerificationResult | null;
  approvalRecord?: FounderApprovalRecord | null;
  realityResult?: ExecutionRealityResult | null;
  recoveryChain?: RecoveryChain | null;
  autoFixRecord?: AutoFixPermissionRecord | null;
  rollbackRetryPlan?: RollbackRetryPlan | null;
  ledgerRecord?: ExecutionEvidenceLedgerRecord | null;
}

export interface ApplyGateChecks {
  verificationSatisfied: boolean;
  approvalSatisfied: boolean;
  realitySatisfied: boolean;
  contradictionCount: number;
  rollbackRequired: boolean;
  retryRequired: boolean;
  retryRecommended: boolean;
  autonomyBlocked: boolean;
  recoveryPending: boolean;
  approvalPending: boolean;
}

export interface VerificationGatedApplyRecord {
  applyRecordId: string;
  packageId: string;
  readinessState: ReadinessState;
  applyVerdict: ApplyVerdict;
  riskLevel: ApplyRiskLevel;
  approvalSatisfied: boolean;
  verificationSatisfied: boolean;
  realitySatisfied: boolean;
  contradictionCount: number;
  evidenceLinks: ApplyEvidenceLink[];
  stateSequence: ApplyState[];
  blockReasons: string[];
  pendingReasons: string[];
  createdAt: number;
  decisionGateOnlyConfirmed: boolean;
  noExecutionOccurred: boolean;
  noFilesModified: boolean;
}

export interface VerificationGatedApplyState {
  gateId: string;
  evaluationCount: number;
  allowedCount: number;
  blockedCount: number;
  pendingCount: number;
  warnings: string[];
  errors: string[];
}

export interface VerificationGatedApplyReport {
  ownerModule: string;
  evaluationCount: number;
  latestRecord: VerificationGatedApplyRecord | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const VERIFICATION_GATED_APPLY_OWNER_MODULE = 'devpulse_v2_verification_gated_apply';
export const VERIFICATION_GATED_APPLY_PASS_TOKEN = 'DEVPULSE_V2_VERIFICATION_GATED_APPLY_V1_PASS';

export const DEPENDENCY_SYSTEMS = [
  'execution_reality_validation',
  'execution_evidence_ledger',
  'recovery_chains',
  'auto_fix_control_panel',
  'rollback_retry_engine',
] as const;

export const DUPLICATE_PATTERNS = [
  'apply_gate',
  'execution_gate',
  'verification_gate',
  'approval_gate',
  'apply_authority',
  'deployment_gate',
] as const;
