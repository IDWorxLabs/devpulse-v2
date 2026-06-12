/**
 * Execution Proof Evolution — scoring and verdict derivation.
 */

import {
  LOOP_RISK_UNPROVEN_THRESHOLD,
  SCORE_BEFORE_AFTER_EVIDENCE,
  SCORE_CAUSAL_LINK,
  SCORE_INDEPENDENT_CONFIRMATION,
  SCORE_NO_REGRESSION,
  SCORE_ORIGINAL_FAILURE_RETESTED,
  SCORE_REUSABLE_MEMORY,
  VERDICT_NOT_PROVEN_MIN,
  VERDICT_PARTIALLY_PROVEN_MIN,
  VERDICT_PROVEN_FIXED_MIN,
} from './execution-proof-registry.js';
import type {
  ExecutionProofAttempt,
  ExecutionProofConfidence,
  ExecutionProofFixDisposition,
  ExecutionProofScoreBreakdown,
  ExecutionProofVerdict,
} from './execution-proof-types.js';

export interface ExecutionProofEvaluationResult {
  executionProofScore: number;
  verdict: ExecutionProofVerdict;
  confidence: ExecutionProofConfidence;
  originalFailureImproved: boolean;
  regressionDetected: boolean;
  proofStrongEnough: boolean;
  fixDisposition: ExecutionProofFixDisposition;
  scoreBreakdown: ExecutionProofScoreBreakdown;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function hasBeforeAfterEvidence(attempt: ExecutionProofAttempt): boolean {
  const { snapshot } = attempt;
  if (snapshot.beforeState.trim().length === 0 || snapshot.afterState.trim().length === 0) {
    return false;
  }
  if (snapshot.metricBefore !== null && snapshot.metricAfter !== null) {
    return snapshot.metricBefore !== snapshot.metricAfter;
  }
  return snapshot.beforeState !== snapshot.afterState;
}

function hasRegressionEvidence(attempt: ExecutionProofAttempt): boolean {
  return (
    attempt.snapshot.regressionObserved || attempt.evidence.some((item) => item.supportsRegression)
  );
}

function awardsNoRegressionPoints(attempt: ExecutionProofAttempt): boolean {
  if (hasRegressionEvidence(attempt)) return false;
  if (attempt.originalFailureRetested) return true;
  return attempt.evidence.some(
    (item) => item.supportsImprovement && item.source !== 'MISSING_EVIDENCE',
  );
}

function hasIndependentConfirmation(attempt: ExecutionProofAttempt): boolean {
  const improving = attempt.evidence.filter(
    (item) => item.supportsImprovement && item.source !== 'MISSING_EVIDENCE',
  );
  if (improving.length < 2) return false;
  const sources = new Set(improving.map((item) => item.source));
  return sources.size >= 2;
}

function hasReusableMemorySignal(attempt: ExecutionProofAttempt): boolean {
  return attempt.evidence.some(
    (item) =>
      item.supportsImprovement &&
      (item.source === 'BEFORE_AFTER_METRIC' ||
        item.source === 'RUNTIME_OBSERVATION' ||
        item.source === 'FOUNDER_SIMULATION_RESULT'),
  );
}

function scoreFromAttempt(attempt: ExecutionProofAttempt): ExecutionProofScoreBreakdown {
  const breakdown: ExecutionProofScoreBreakdown = {
    originalFailureRetested: attempt.originalFailureRetested ? SCORE_ORIGINAL_FAILURE_RETESTED : 0,
    beforeAfterEvidence: hasBeforeAfterEvidence(attempt) ? SCORE_BEFORE_AFTER_EVIDENCE : 0,
    independentConfirmation: hasIndependentConfirmation(attempt) ? SCORE_INDEPENDENT_CONFIRMATION : 0,
    noRegression: awardsNoRegressionPoints(attempt) ? SCORE_NO_REGRESSION : 0,
    causalLink: attempt.causalLinkToFix ? SCORE_CAUSAL_LINK : 0,
    reusableMemory: hasReusableMemorySignal(attempt) ? SCORE_REUSABLE_MEMORY : 0,
  };
  return breakdown;
}

function totalScore(breakdown: ExecutionProofScoreBreakdown): number {
  return clamp(
    breakdown.originalFailureRetested +
      breakdown.beforeAfterEvidence +
      breakdown.independentConfirmation +
      breakdown.noRegression +
      breakdown.causalLink +
      breakdown.reusableMemory,
  );
}

function verdictFromScore(score: number): ExecutionProofVerdict {
  if (score >= VERDICT_PROVEN_FIXED_MIN) return 'PROVEN_FIXED';
  if (score >= VERDICT_PARTIALLY_PROVEN_MIN) return 'PARTIALLY_PROVEN';
  if (score >= VERDICT_NOT_PROVEN_MIN) return 'NOT_PROVEN';
  return 'INSUFFICIENT_EVIDENCE';
}

function deriveConfidence(score: number, verdict: ExecutionProofVerdict): ExecutionProofConfidence {
  if (verdict === 'REGRESSION_DETECTED' || verdict === 'LOOP_RISK') return 'LOW';
  if (score >= VERDICT_PROVEN_FIXED_MIN) return 'HIGH';
  if (score >= VERDICT_PARTIALLY_PROVEN_MIN) return 'MEDIUM';
  return 'LOW';
}

function deriveFixDisposition(verdict: ExecutionProofVerdict): ExecutionProofFixDisposition {
  switch (verdict) {
    case 'PROVEN_FIXED':
      return 'KEEP';
    case 'REGRESSION_DETECTED':
      return 'REVERT';
    case 'LOOP_RISK':
      return 'ESCALATE';
    case 'INSUFFICIENT_EVIDENCE':
      return 'ESCALATE';
    case 'NOT_PROVEN':
    case 'PARTIALLY_PROVEN':
    default:
      return 'RETRY';
  }
}

export function evaluateExecutionProofAttempt(
  attempt: ExecutionProofAttempt,
  priorUnprovenAttemptsForProblem = 0,
): ExecutionProofEvaluationResult {
  const regressionDetected = hasRegressionEvidence(attempt);

  const originalFailureImproved =
    attempt.originalFailureRetested &&
    !attempt.snapshot.originalFailureStillPresent &&
    attempt.evidence.some((item) => item.supportsImprovement);

  const scoreBreakdown = scoreFromAttempt(attempt);
  const executionProofScore = totalScore(scoreBreakdown);

  let verdict = verdictFromScore(executionProofScore);

  if (regressionDetected) {
    verdict = 'REGRESSION_DETECTED';
  } else if (
    priorUnprovenAttemptsForProblem >= LOOP_RISK_UNPROVEN_THRESHOLD &&
    verdict !== 'PROVEN_FIXED'
  ) {
    verdict = 'LOOP_RISK';
  }

  const confidence = deriveConfidence(executionProofScore, verdict);
  const proofStrongEnough = verdict === 'PROVEN_FIXED';
  const fixDisposition = deriveFixDisposition(verdict);

  return {
    executionProofScore,
    verdict,
    confidence,
    originalFailureImproved,
    regressionDetected,
    proofStrongEnough,
    fixDisposition,
    scoreBreakdown,
  };
}
