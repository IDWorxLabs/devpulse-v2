/**
 * Autonomous Completion Engine — completion readiness evaluation.
 */

import type {
  CompletionEvidenceAnalysis,
  CompletionInput,
  CompletionReadiness,
} from './autonomous-completion-engine-types.js';
import type { CompletionLoopGuardResult } from './autonomous-completion-engine-types.js';

export function evaluateCompletionReadiness(
  input: CompletionInput,
  evidence: CompletionEvidenceAnalysis,
  trustScore: number,
  riskScore: number,
  confidence: number,
  loopGuard: CompletionLoopGuardResult,
): CompletionReadiness {
  if (input.missingDependencies || evidence.missingEvidence.length >= 5) {
    return 'BLOCKED';
  }

  if (loopGuard.status === 'LOOP_DETECTED') {
    return 'TRUST_RECOVERY_REQUIRED';
  }

  if (trustScore < 40 || input.trustRecoveryActive || input.verificationDisagreement) {
    return 'TRUST_RECOVERY_REQUIRED';
  }

  if (input.criticalSubsystem && riskScore >= 60) {
    return 'HIGH_RISK';
  }

  if (input.blastRadius === 'PLATFORM' && riskScore >= 50) {
    return 'HIGH_RISK';
  }

  if (
    evidence.missingEvidence.length <= 1 &&
    confidence >= 70 &&
    trustScore >= 65 &&
    riskScore <= 35
  ) {
    return 'READY';
  }

  if (evidence.missingEvidence.length >= 2 || confidence < 50) {
    return 'NEEDS_MORE_EVIDENCE';
  }

  if (confidence >= 55 && riskScore < 55) {
    return 'READY';
  }

  return 'NEEDS_MORE_EVIDENCE';
}
