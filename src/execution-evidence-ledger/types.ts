/** DevPulse V2 Execution Evidence Ledger — types. */

import type { RuntimeState } from '../execution-runtime/types.js';
import type { VerificationVerdict } from '../execution-verification/types.js';
import type { RecoveryNeedType } from '../recovery-execution/types.js';
import type { ApprovalDecisionType } from '../founder-approval-execution/types.js';
import type {
  RealityConfidence,
  RealityContradiction,
  RealityVerdict,
} from '../execution-reality-validation/types.js';

export type LedgerState =
  | 'LEDGER_INPUT_RECEIVED'
  | 'CHAIN_REFERENCES_CAPTURED'
  | 'EVIDENCE_LINKS_CREATED'
  | 'LEDGER_RECORD_CREATED'
  | 'LEDGER_INDEX_UPDATED'
  | 'LEDGER_STORAGE_CONFIRMED';

export type EvidenceLinkType =
  | 'authority'
  | 'runtime'
  | 'verification'
  | 'recovery'
  | 'approval'
  | 'reality';

export interface EvidenceLink {
  linkId: string;
  linkType: EvidenceLinkType;
  referenceId: string;
  systemId: string;
  createdAt: number;
}

export interface ExecutionEvidenceLedgerRecord {
  ledgerRecordId: string;
  packageId: string;
  authorityId: string;
  runtimeRecordId: string | null;
  verificationId: string | null;
  recoveryPlanId: string | null;
  approvalRequestId: string | null;
  realityValidationId: string | null;
  runtimeDecision: RuntimeState | null;
  verificationVerdict: VerificationVerdict | null;
  recoveryNeed: RecoveryNeedType | null;
  approvalDecision: ApprovalDecisionType | null;
  realityVerdict: RealityVerdict | null;
  confidence: RealityConfidence | null;
  chainComplete: boolean;
  contradictions: RealityContradiction[];
  evidenceLinks: EvidenceLink[];
  stateSequence: LedgerState[];
  createdAt: number;
  historyOnlyConfirmed: boolean;
  noExecutionOccurred: boolean;
}

export interface EvidenceChainInput {
  packageId: string;
  authorityId: string;
  authorityDecisionId: string | null;
  runtimeRecordId: string | null;
  verificationId: string | null;
  recoveryPlanId: string | null;
  recoveryRecordId: string | null;
  approvalRequestId: string | null;
  runtimeDecision: RuntimeState | null;
  verificationVerdict: VerificationVerdict | null;
  recoveryNeed: RecoveryNeedType | null;
  approvalDecision: ApprovalDecisionType | null;
  realityValidationId: string | null;
  realityVerdict: RealityVerdict | null;
  confidence: RealityConfidence | null;
  chainComplete: boolean;
  contradictions: RealityContradiction[];
}

export interface ExecutionEvidenceLedgerState {
  ledgerId: string;
  recordCount: number;
  warnings: string[];
  errors: string[];
}

export interface ExecutionEvidenceReport {
  ownerModule: string;
  recordCount: number;
  latestRecord: ExecutionEvidenceLedgerRecord | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const EVIDENCE_LEDGER_OWNER_MODULE = 'devpulse_v2_execution_evidence_ledger';
export const EVIDENCE_LEDGER_PASS_TOKEN = 'DEVPULSE_V2_EXECUTION_EVIDENCE_LEDGER_V1_PASS';

export const DEPENDENCY_SYSTEMS = [
  'execution_authority',
  'execution_package_runtime',
  'execution_verification_loop',
  'recovery_execution_engine',
  'founder_approval_execution_gate',
  'execution_reality_validation',
] as const;
