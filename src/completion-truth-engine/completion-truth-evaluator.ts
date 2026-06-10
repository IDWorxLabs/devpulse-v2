/**
 * Completion Truth Engine — completion truth evaluator.
 */

import type {
  CompletionConsistencyScores,
  CompletionTruthDecision,
  CompletionTruthEvaluation,
  CompletionTruthState,
  FalseCompletionDetection,
  UnifiedCompletionTruthAuthority,
} from './completion-truth-types.js';
import { getCachedEvaluation, setCachedEvaluation } from './completion-truth-cache.js';

let evaluationCount = 0;

const STATE_WEIGHT: Record<CompletionTruthState, number> = {
  UNKNOWN: 5,
  INCOMPLETE: 15,
  PARTIALLY_COMPLETE: 45,
  SUBSTANTIALLY_COMPLETE: 70,
  COMPLETE: 95,
  FALSE_COMPLETION: 5,
  CONTRADICTED: 0,
};

const DECISION_WEIGHT: Record<CompletionTruthDecision, number> = {
  NOT_COMPLETE: 10,
  NEEDS_VERIFICATION: 35,
  NEEDS_EVIDENCE: 30,
  NEEDS_REALITY_VALIDATION: 25,
  COMPLETE: 95,
  FALSE_COMPLETION_DETECTED: 5,
  BLOCKED: 0,
};

export function evaluateCompletionTruth(
  authority: UnifiedCompletionTruthAuthority,
  consistency: CompletionConsistencyScores,
  falseCompletion: FalseCompletionDetection,
): CompletionTruthEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.truthState,
    authority.decision,
    falseCompletion.riskScore,
  ].join('|');

  const cached = getCachedEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const completionConfidence = Math.max(
    0,
    Math.min(100, Math.round(authority.completionTruthScore - falseCompletion.riskScore * 0.4)),
  );

  const completionTruthScore = authority.completionTruthScore;

  const completionReadiness = Math.round(
    (STATE_WEIGHT[authority.truthState] + DECISION_WEIGHT[authority.decision]) / 2,
  );

  const completionStability = Math.max(
    0,
    Math.min(100, Math.round(consistency.stabilityScore - authority.gapCount * 3)),
  );

  const result: CompletionTruthEvaluation = {
    completionConfidence,
    completionTruthScore,
    completionReadiness,
    completionStability,
    truthState: authority.truthState,
    decision: authority.decision,
  };

  setCachedEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetCompletionTruthEvaluatorForTests(): void {
  evaluationCount = 0;
}
