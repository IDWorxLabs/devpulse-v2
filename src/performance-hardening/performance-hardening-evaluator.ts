/**
 * Performance Hardening — performance hardening evaluator.
 */

import type {
  PerformanceHardeningEvaluation,
  UnifiedPerformanceHardeningAuthority,
} from './performance-hardening-types.js';
import { getCachedPerformanceEvaluation, setCachedPerformanceEvaluation } from './performance-hardening-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<PerformanceHardeningEvaluation['state'], number> = {
  FAST: 95,
  ACCEPTABLE: 80,
  WATCH: 65,
  SLOW: 45,
  DEGRADED: 25,
  BLOCKED: 0,
};

export function evaluatePerformanceHardening(
  authority: UnifiedPerformanceHardeningAuthority,
): PerformanceHardeningEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.performanceScore,
    authority.state,
    authority.riskLevel,
  ].join('|');

  const cached = getCachedPerformanceEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: PerformanceHardeningEvaluation = {
    performanceScore: authority.performanceScore,
    startupScore: authority.startupScore,
    validationScore: authority.validationScore,
    responsivenessScore: authority.responsivenessScore,
    state: authority.state,
    riskLevel: authority.riskLevel,
    confidence: authority.confidence,
    hardeningReadiness: Math.round((STATE_READINESS[authority.state] + authority.confidence) / 2),
  };

  setCachedPerformanceEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetPerformanceHardeningEvaluatorForTests(): void {
  evaluationCount = 0;
}
