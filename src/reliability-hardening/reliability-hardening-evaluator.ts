/**
 * Reliability Hardening — reliability hardening evaluator.
 */

import type {
  ReliabilityHardeningEvaluation,
  UnifiedReliabilityHardeningAuthority,
} from './reliability-hardening-types.js';
import { getCachedReliabilityEvaluation, setCachedReliabilityEvaluation } from './reliability-hardening-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<ReliabilityHardeningEvaluation['state'], number> = {
  STABLE: 95,
  WATCH: 75,
  DEGRADED: 55,
  UNSTABLE: 35,
  FAILURE_LIKELY: 15,
  BLOCKED: 0,
};

export function evaluateReliabilityHardening(
  authority: UnifiedReliabilityHardeningAuthority,
): ReliabilityHardeningEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.reliabilityScore,
    authority.state,
    authority.riskLevel,
  ].join('|');

  const cached = getCachedReliabilityEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: ReliabilityHardeningEvaluation = {
    reliabilityScore: authority.reliabilityScore,
    stabilityScore: authority.stabilityScore,
    recoveryReadinessScore: authority.recoveryReadinessScore,
    hardeningReadiness: Math.round((STATE_READINESS[authority.state] + authority.confidence) / 2),
    state: authority.state,
    riskLevel: authority.riskLevel,
    confidence: authority.confidence,
  };

  setCachedReliabilityEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetReliabilityHardeningEvaluatorForTests(): void {
  evaluationCount = 0;
}
