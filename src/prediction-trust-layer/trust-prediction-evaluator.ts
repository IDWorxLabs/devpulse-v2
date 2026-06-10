/**
 * Prediction Trust Layer — trust prediction evaluator.
 */

import type {
  PredictionTrustDecision,
  PredictionTrustEvaluation,
  TrustVolatilityAnalysis,
  UnifiedPredictionTrustAuthority,
} from './prediction-trust-types.js';
import { getCachedPredictionEvaluation, setCachedPredictionEvaluation } from './prediction-trust-cache.js';

let evaluationCount = 0;

const DECISION_READINESS: Record<PredictionTrustDecision, number> = {
  TRUST_STABLE: 90,
  TRUST_WATCH: 65,
  TRUST_DEGRADING: 45,
  TRUST_FAILURE_LIKELY: 25,
  TRUST_RECOVERY_RECOMMENDED: 35,
  BLOCKED: 5,
};

export function evaluateTrustPrediction(
  authority: UnifiedPredictionTrustAuthority,
  volatility: TrustVolatilityAnalysis,
): PredictionTrustEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.decision,
    authority.predictedRiskScore,
    volatility.stabilityScore,
  ].join('|');

  const cached = getCachedPredictionEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: PredictionTrustEvaluation = {
    predictionConfidence: authority.confidence,
    predictedTrustScore: authority.predictedTrustScore,
    predictedRiskScore: authority.predictedRiskScore,
    predictionReadiness: Math.round((DECISION_READINESS[authority.decision] + authority.confidence) / 2),
    predictionStability: volatility.stabilityScore,
    decision: authority.decision,
  };

  setCachedPredictionEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetTrustPredictionEvaluatorForTests(): void {
  evaluationCount = 0;
}
