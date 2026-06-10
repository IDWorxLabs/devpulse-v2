/**
 * Autonomous Verification — readiness evaluation.
 */

import type {
  EvidenceAnalysis,
  VerificationDecision,
  VerificationInput,
  VerificationReadiness,
} from './autonomous-verification-types.js';

export function evaluateVerificationReadiness(
  input: VerificationInput,
  decision: VerificationDecision,
  evidence: EvidenceAnalysis,
  trustScore: number,
  riskScore: number,
  confidence: number,
): VerificationReadiness {
  if (decision === 'BLOCKED' || input.missingDependencies) {
    return 'BLOCKED';
  }

  if (decision === 'TRUST_RECOVERY_REQUIRED' || trustScore < 40) {
    return 'TRUST_RECOVERY_REQUIRED';
  }

  if (input.criticalSubsystem && riskScore >= 60) {
    return 'HIGH_RISK';
  }

  if (input.blastRadius === 'PLATFORM' && riskScore >= 50) {
    return 'HIGH_RISK';
  }

  if (evidence.missingEvidence.length >= 2 || confidence < 50) {
    return 'NEEDS_MORE_EVIDENCE';
  }

  if (decision === 'VERIFIED' && confidence >= 65 && riskScore < 50) {
    return 'READY';
  }

  if (confidence >= 55 && riskScore < 60) {
    return 'READY';
  }

  return 'NEEDS_MORE_EVIDENCE';
}
