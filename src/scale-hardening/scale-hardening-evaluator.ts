/**
 * Scale Hardening — scale hardening evaluator.
 */

import type {
  ScaleHardeningEvaluation,
  UnifiedScaleHardeningAuthority,
} from './scale-hardening-types.js';
import { getCachedScaleEvaluation, setCachedScaleEvaluation } from './scale-hardening-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<ScaleHardeningEvaluation['state'], number> = {
  READY: 95,
  ACCEPTABLE: 80,
  WATCH: 65,
  STRAINED: 45,
  UNSAFE: 25,
  BLOCKED: 0,
};

export function evaluateScaleHardening(
  authority: UnifiedScaleHardeningAuthority,
): ScaleHardeningEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.scaleScore,
    authority.state,
    authority.riskLevel,
  ].join('|');

  const cached = getCachedScaleEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: ScaleHardeningEvaluation = {
    scaleScore: authority.scaleScore,
    capacityScore: authority.capacityScore,
    concurrencyScore: authority.concurrencyScore,
    cloudUsageReadinessScore: authority.cloudUsageReadinessScore,
    queueLoadScore: authority.queueLoadScore,
    multiProjectScaleScore: authority.multiProjectScaleScore,
    state: authority.state,
    riskLevel: authority.riskLevel,
    confidence: authority.confidence,
    hardeningReadiness: Math.round((STATE_READINESS[authority.state] + authority.confidence) / 2),
  };

  setCachedScaleEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetScaleHardeningEvaluatorForTests(): void {
  evaluationCount = 0;
}
