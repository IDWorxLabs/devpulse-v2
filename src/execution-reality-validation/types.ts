/** DevPulse V2 Execution Reality Validation — types. */

import type { ExecutionDecision } from '../execution-authority/types.js';
import type { RuntimeRecord } from '../execution-runtime/types.js';
import type { ExecutionVerificationResult } from '../execution-verification/types.js';
import type { RecoveryRecord } from '../recovery-execution/types.js';
import type { FounderApprovalRecord } from '../founder-approval-execution/types.js';

export type RealityState =
  | 'REALITY_INPUT_RECEIVED'
  | 'AUTHORITY_VALIDATED'
  | 'RUNTIME_VALIDATED'
  | 'VERIFICATION_VALIDATED'
  | 'RECOVERY_VALIDATED'
  | 'APPROVAL_VALIDATED'
  | 'CONSISTENCY_CHECK_COMPLETED'
  | 'CONTRADICTION_CHECK_COMPLETED'
  | 'CONFIDENCE_COMPUTED'
  | 'REALITY_VALIDATION_COMPLETE';

export type RealityVerdict = 'REALITY_TRUSTED' | 'REALITY_WARNING' | 'REALITY_FAILED';

export type RealityConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type ContradictionSeverity = 'CRITICAL' | 'WARNING';

export type ContradictionCode =
  | 'authority_missing'
  | 'runtime_missing'
  | 'verification_missing'
  | 'required_recovery_missing'
  | 'required_approval_missing'
  | 'runtime_allowed_authority_blocked'
  | 'trusted_verification_authority_missing'
  | 'trusted_verification_runtime_missing'
  | 'approval_approved_when_not_required'
  | 'recovery_exists_when_not_needed'
  | 'recovery_missing_when_required';

export interface RealityContradiction {
  code: ContradictionCode;
  severity: ContradictionSeverity;
  message: string;
}

export interface LayerStatus {
  present: boolean;
  detail: string;
}

export interface ExecutionRealityChainInput {
  packageId: string;
  authorityDecision: ExecutionDecision | null;
  runtimeRecord: RuntimeRecord | null;
  verificationResult: ExecutionVerificationResult | null;
  recoveryRecord: RecoveryRecord | null;
  approvalRecord: FounderApprovalRecord | null;
}

export interface ExecutionRealityResult {
  realityValidationId: string;
  packageId: string;
  createdAt: number;
  authorityStatus: LayerStatus;
  runtimeStatus: LayerStatus;
  verificationStatus: LayerStatus;
  recoveryStatus: LayerStatus;
  approvalStatus: LayerStatus;
  contradictions: RealityContradiction[];
  confidence: RealityConfidence;
  verdict: RealityVerdict;
  chainComplete: boolean;
  stateSequence: RealityState[];
  warnings: string[];
  errors: string[];
  noExecutionOccurred: boolean;
}

export interface ExecutionRealityValidationState {
  validatorId: string;
  validationCount: number;
  trustedCount: number;
  warningCount: number;
  failedCount: number;
  warnings: string[];
  errors: string[];
}

export interface ExecutionRealityReport {
  ownerModule: string;
  validationCount: number;
  latestResult: ExecutionRealityResult | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const REALITY_VALIDATION_OWNER_MODULE = 'devpulse_v2_execution_reality_validation';
export const REALITY_VALIDATION_PASS_TOKEN = 'DEVPULSE_V2_EXECUTION_REALITY_VALIDATION_V1_PASS';

export const DEPENDENCY_SYSTEMS = [
  'execution_authority',
  'execution_package_runtime',
  'execution_verification_loop',
  'recovery_execution_engine',
  'founder_approval_execution_gate',
] as const;
