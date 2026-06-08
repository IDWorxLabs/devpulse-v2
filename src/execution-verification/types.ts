/** DevPulse V2 Execution Verification Loop — types. */

import type { ExecutionDecision } from '../execution-authority/types.js';
import type { RuntimeDecision, RuntimeRecord } from '../execution-runtime/types.js';

export type VerificationState =
  | 'VERIFICATION_RECEIVED'
  | 'RUNTIME_RECORD_FOUND'
  | 'AUTHORITY_ALIGNMENT_CHECKED'
  | 'GATE_ALIGNMENT_CHECKED'
  | 'NO_EXECUTION_CONFIRMED'
  | 'EVIDENCE_ATTACHED'
  | 'VERIFICATION_PASSED'
  | 'VERIFICATION_WARNING'
  | 'VERIFICATION_FAILED';

export type VerificationVerdict = 'TRUSTED' | 'WARNING' | 'FAILED';

export type VerificationEvidenceSource =
  | 'execution_package_runtime'
  | 'execution_authority'
  | 'runtime_state_machine'
  | 'future_gate_mapping'
  | 'no_execution_confirmation';

export type VerificationEvidenceStatus = 'PASS' | 'WARN' | 'FAIL' | 'INFO';

export interface VerificationEvidence {
  evidenceId: string;
  source: VerificationEvidenceSource;
  claim: string;
  status: VerificationEvidenceStatus;
  details: string;
  critical: boolean;
}

export interface ExecutionVerificationResult {
  verificationId: string;
  packageId: string;
  createdAt: number;
  runtimeRecord: RuntimeRecord | null;
  runtimeDecision: RuntimeDecision | null;
  authorityDecision: ExecutionDecision | null;
  verdict: VerificationVerdict;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  stateSequence: VerificationState[];
  evidence: VerificationEvidence[];
  warnings: string[];
  failures: string[];
  noExecutionConfirmedByLoop: boolean;
}

export interface ExecutionVerificationLoopState {
  loopId: string;
  verificationCount: number;
  trustedCount: number;
  warningCount: number;
  failedCount: number;
  warnings: string[];
  errors: string[];
}

export interface ExecutionVerificationReport {
  ownerModule: string;
  verificationCount: number;
  trustedCount: number;
  warningCount: number;
  failedCount: number;
  latestResult: ExecutionVerificationResult | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const VERIFICATION_OWNER_MODULE = 'devpulse_v2_execution_verification_loop';
export const VERIFICATION_PASS_TOKEN = 'DEVPULSE_V2_EXECUTION_VERIFICATION_LOOP_V1_PASS';

export const DEPENDENCY_SYSTEMS = [
  'execution_authority',
  'execution_package_runtime',
] as const;

export interface VerificationCheckOutcome {
  failures: string[];
  warnings: string[];
}
