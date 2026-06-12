/**
 * Execution Proof Evolution → Execution Evidence Ledger bridge.
 * 24E remains proof authority; ledger remains proof persistence owner.
 */

import { DevPulseV2ExecutionEvidenceLedger } from '../execution-evidence-ledger/execution-evidence-ledger.js';
import type { EvidenceChainInput, ExecutionEvidenceLedgerRecord } from '../execution-evidence-ledger/types.js';
import type { ExecutionProofAssessment } from './execution-proof-types.js';
import type {
  RealityConfidence,
  RealityContradiction,
  RealityVerdict,
} from '../execution-reality-validation/types.js';

export const EXECUTION_PROOF_AUTHORITATIVE_OWNER = 'execution_proof_evolution';
export const EXECUTION_PROOF_PERSISTENCE_OWNER = 'execution_evidence_ledger';

function mapProofVerdictToRealityVerdict(assessment: ExecutionProofAssessment): RealityVerdict {
  if (assessment.regressionDetected || assessment.verdict === 'REGRESSION_DETECTED') {
    return 'REALITY_FAILED';
  }
  if (assessment.verdict === 'PROVEN_FIXED') {
    return 'REALITY_TRUSTED';
  }
  if (assessment.verdict === 'PARTIALLY_PROVEN') {
    return 'REALITY_WARNING';
  }
  return 'REALITY_FAILED';
}

function mapProofConfidence(confidence: ExecutionProofAssessment['confidence']): RealityConfidence {
  return confidence;
}

function buildProofContradictions(assessment: ExecutionProofAssessment): RealityContradiction[] {
  if (!assessment.regressionDetected) {
    return [];
  }

  return [
    {
      code: 'verification_missing',
      severity: 'CRITICAL',
      message: `Execution proof regression detected for ${assessment.problem.problemId} — fix-created is not proof.`,
    },
  ];
}

export function mapExecutionProofAssessmentToEvidenceChain(
  assessment: ExecutionProofAssessment,
  packageId?: string,
): EvidenceChainInput {
  const resolvedPackageId =
    packageId ?? `execution-proof-${assessment.problem.problemId}-${assessment.attempt.attemptId}`;

  return {
    packageId: resolvedPackageId,
    authorityId: EXECUTION_PROOF_AUTHORITATIVE_OWNER,
    authorityDecisionId: assessment.cacheKey,
    runtimeRecordId: null,
    verificationId: null,
    recoveryPlanId: null,
    recoveryRecordId: null,
    approvalRequestId: null,
    runtimeDecision: null,
    verificationVerdict: null,
    recoveryNeed: null,
    approvalDecision: null,
    realityValidationId: assessment.attempt.attemptId,
    realityVerdict: mapProofVerdictToRealityVerdict(assessment),
    confidence: mapProofConfidence(assessment.confidence),
    chainComplete:
      assessment.verdict === 'PROVEN_FIXED' || assessment.verdict === 'PARTIALLY_PROVEN',
    contradictions: buildProofContradictions(assessment),
  };
}

export function recordExecutionProofAssessmentInLedger(
  assessment: ExecutionProofAssessment,
  ledger?: DevPulseV2ExecutionEvidenceLedger,
  packageId?: string,
): ExecutionEvidenceLedgerRecord {
  const instance = ledger ?? new DevPulseV2ExecutionEvidenceLedger();
  const chain = mapExecutionProofAssessmentToEvidenceChain(assessment, packageId);
  return instance.recordChain(chain);
}
