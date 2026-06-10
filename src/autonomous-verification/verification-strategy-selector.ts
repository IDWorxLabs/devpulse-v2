/**
 * Autonomous Verification — decision selection.
 */

import type {
  EvidenceAnalysis,
  VerificationDecision,
  VerificationInput,
} from './autonomous-verification-types.js';

export function selectVerificationDecision(
  input: VerificationInput,
  evidence: EvidenceAnalysis,
  trustScore: number,
  riskScore: number,
  confidence: number,
): VerificationDecision {
  if (input.missingDependencies || evidence.missingEvidence.length >= 5) {
    return 'BLOCKED';
  }

  if (input.policyConflict || input.governanceBoundary) {
    return 'FOUNDER_REVIEW';
  }

  if (trustScore < 40 || input.verificationDisagreement || (input.repeatFailures ?? 0) >= 3) {
    return 'TRUST_RECOVERY_REQUIRED';
  }

  if (
    input.testResultStatus === 'SIMULATED_FAIL' ||
    ((input.repairCandidates?.length ?? 0) > 0 && input.fixReadiness !== 'READY')
  ) {
    return 'NEEDS_FIXING';
  }

  if (
    input.testingCoverageSufficient === false ||
    input.testResultStatus === 'NOT_EXECUTED' ||
    !evidence.evidenceTypes.includes('TEST')
  ) {
    if (confidence < 70) {
      return 'NEEDS_TESTING';
    }
  }

  if (
    confidence >= 70 &&
    trustScore >= 65 &&
    riskScore <= 35 &&
    evidence.missingEvidence.length <= 1
  ) {
    return 'VERIFIED';
  }

  if (confidence < 45 || evidence.missingEvidence.length >= 3) {
    return 'BLOCKED';
  }

  if (confidence < 55) {
    return 'FOUNDER_REVIEW';
  }

  if (riskScore >= 65) {
    return 'NEEDS_FIXING';
  }

  return 'NEEDS_TESTING';
}
