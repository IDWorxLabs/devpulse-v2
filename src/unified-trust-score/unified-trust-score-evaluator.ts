/**
 * Unified Trust Score — unified trust score evaluator.
 */

import type {
  TrustConsistencyAnalysis,
  UnifiedTrustScoreAuthority,
  UnifiedTrustScoreEvaluation,
} from './unified-trust-score-types.js';
import { getCachedTrustScoreEvaluation, setCachedTrustScoreEvaluation } from './unified-trust-score-cache.js';

let evaluationCount = 0;

const DECISION_READINESS: Record<UnifiedTrustScoreEvaluation['decision'], number> = {
  TRUST_VERIFIED: 95,
  TRUST_STRONG: 80,
  TRUST_ACCEPTABLE: 65,
  TRUST_UNCERTAIN: 45,
  TRUST_WEAK: 25,
  TRUST_REJECTED: 10,
  BLOCKED: 0,
};

export function evaluateUnifiedTrustScore(
  authority: UnifiedTrustScoreAuthority,
  consistency: TrustConsistencyAnalysis,
): UnifiedTrustScoreEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.trustScore,
    authority.decision,
    consistency.consistencyScore,
  ].join('|');

  const cached = getCachedTrustScoreEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: UnifiedTrustScoreEvaluation = {
    finalTrustScore: authority.trustScore,
    trustLevel: authority.trustLevel,
    decision: authority.decision,
    trustReadiness: Math.round((DECISION_READINESS[authority.decision] + authority.confidence) / 2),
    scoreStability: consistency.consistencyScore,
  };

  setCachedTrustScoreEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetUnifiedTrustScoreEvaluatorForTests(): void {
  evaluationCount = 0;
}
