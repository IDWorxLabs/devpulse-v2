/**
 * Multi Project Verification — readiness evaluation.
 */

import type {
  ProjectVerificationStatus,
  ProjectVerificationInput,
  ProjectVerificationEvidence,
} from './multi-project-verification-types.js';

export function evaluateProjectVerificationReadiness(
  input: ProjectVerificationInput,
  evidence: ProjectVerificationEvidence,
  confidence: number,
  riskScore: number,
): ProjectVerificationStatus {
  if (input.projectState === 'FAILED' || input.projectState === 'ARCHIVED') {
    return 'BLOCKED';
  }

  if (input.isolationOk === false) {
    return 'BLOCKED';
  }

  if ((input.trustScore ?? 70) < 35) {
    return 'TRUST_RECOVERY_REQUIRED';
  }

  if (riskScore >= 70 || (input.criticalSubsystem && riskScore >= 55)) {
    return 'HIGH_RISK';
  }

  if (
    confidence >= 75 &&
    riskScore < 40 &&
    evidence.missingEvidence.length === 0 &&
    (input.verificationDecision === 'VERIFIED' || input.testResultStatus === 'SIMULATED_PASS')
  ) {
    return 'VERIFIED';
  }

  if (confidence >= 60 && riskScore < 55 && evidence.missingEvidence.length <= 1) {
    return 'VERIFIED';
  }

  return 'NEEDS_VERIFICATION';
}

export function isVerificationReady(status: ProjectVerificationStatus): boolean {
  return status === 'VERIFIED';
}
