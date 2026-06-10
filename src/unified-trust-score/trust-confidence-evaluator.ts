/**
 * Unified Trust Score — trust confidence evaluator.
 */

import type { TrustConfidenceEvaluation, UnifiedTrustScoreInputs } from './unified-trust-score-types.js';
import { resolveConfidenceLevel } from './unified-trust-score-types.js';
import { getCachedConfidenceEvaluation, setCachedConfidenceEvaluation } from './unified-trust-score-cache.js';

let confidenceEvaluationCount = 0;

export function evaluateTrustConfidence(inputs: UnifiedTrustScoreInputs): TrustConfidenceEvaluation {
  const cacheKey = [
    inputs.evidenceConfidence,
    inputs.realityConfidence,
    inputs.completionConfidence,
    inputs.predictionConfidence,
    inputs.trustRuntimeConfidence,
  ].join('|');

  const cached = getCachedConfidenceEvaluation(cacheKey);
  if (cached) return cached;

  confidenceEvaluationCount += 1;

  const confidenceScore = Math.max(0, Math.min(100, Math.round(
    inputs.evidenceConfidence * 0.25
      + inputs.realityConfidence * 0.25
      + inputs.completionConfidence * 0.25
      + inputs.predictionConfidence * 0.15
      + inputs.trustRuntimeConfidence * 0.10,
  )));

  const result: TrustConfidenceEvaluation = {
    confidenceScore,
    confidenceLevel: resolveConfidenceLevel(confidenceScore),
  };

  setCachedConfidenceEvaluation(cacheKey, result);
  return result;
}

export function getConfidenceEvaluationCount(): number {
  return confidenceEvaluationCount;
}

export function resetTrustConfidenceEvaluatorForTests(): void {
  confidenceEvaluationCount = 0;
}
