/**
 * Autonomous Completion Engine — completion decision selection.
 */

import type {
  CompletionDecision,
  CompletionEvidenceAnalysis,
  CompletionInput,
  CompletionLoopGuardResult,
  CompletionReadiness,
} from './autonomous-completion-engine-types.js';

export function selectCompletionDecision(
  input: CompletionInput,
  evidence: CompletionEvidenceAnalysis,
  readiness: CompletionReadiness,
  trustScore: number,
  riskScore: number,
  confidence: number,
  loopGuard: CompletionLoopGuardResult,
): CompletionDecision {
  if (input.missingDependencies) {
    return 'BLOCKED';
  }

  if (input.policyConflict || input.governanceBoundary) {
    return 'FOUNDER_REVIEW';
  }

  if (loopGuard.status === 'LOOP_DETECTED') {
    return 'ESCALATE';
  }

  if (trustScore < 40 || input.trustRecoveryActive || input.verificationDisagreement) {
    return 'TRUST_RECOVERY_REQUIRED';
  }

  if (
    input.unresolvedFailures ||
    input.testResultStatus === 'SIMULATED_FAIL' ||
    ((input.repairCandidates?.length ?? 0) > 0 && input.fixReadiness !== 'READY')
  ) {
    return 'CONTINUE_FIXING';
  }

  if (
    input.testingCoverageSufficient === false ||
    input.testResultStatus === 'NOT_EXECUTED' ||
    evidence.missingEvidence.includes('testing evidence')
  ) {
    return 'CONTINUE_TESTING';
  }

  if (
    input.verificationEvidenceSufficient === false ||
    input.verificationDecision === 'NEEDS_TESTING' ||
    input.verificationDecision === 'NEEDS_FIXING' ||
    (input.verificationDecision !== 'VERIFIED' && confidence < 70)
  ) {
    return 'CONTINUE_VERIFICATION';
  }

  if (
    readiness === 'READY' &&
    confidence >= 70 &&
    trustScore >= 65 &&
    evidence.missingEvidence.length <= 1 &&
    riskScore <= 35
  ) {
    return 'COMPLETE';
  }

  if ((input.repeatFailures ?? 0) >= 3 || riskScore >= 75) {
    return 'ESCALATE';
  }

  if (confidence < 45 || evidence.missingEvidence.length >= 4) {
    return 'BLOCKED';
  }

  if (confidence < 55) {
    return 'FOUNDER_REVIEW';
  }

  return 'CONTINUE_VERIFICATION';
}
