/**
 * Unified Trust Runtime — trust runtime evaluator.
 */

import type { TrustRuntimeEvaluation, UnifiedTrustAuthority } from './trust-runtime-types.js';
import { getCachedEvaluation, setCachedEvaluation } from './trust-runtime-cache.js';

let evaluationCount = 0;

export function evaluateTrustRuntime(authority: UnifiedTrustAuthority): TrustRuntimeEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.overallTrustLevel,
    authority.confidence,
    authority.risk,
    authority.signalCount,
  ].join('|');

  const cached = getCachedEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const readinessComponents = [
    authority.verificationReadiness,
    authority.completionReadiness,
    authority.governanceReadiness,
  ];
  const trustReadiness = Math.round(
    readinessComponents.reduce((sum, v) => sum + v, 0) / readinessComponents.length,
  );

  const trustStability = Math.max(
    0,
    Math.min(100, Math.round(authority.confidence - authority.risk * 0.4 + authority.overallTrustLevel * 0.2)),
  );

  const sourceSpread = authority.participatingSources.length;
  const trustVolatility = Math.max(
    0,
    Math.min(100, Math.round(authority.risk + (sourceSpread < 3 ? 15 : 0))),
  );

  const result: TrustRuntimeEvaluation = {
    overallTrustLevel: authority.overallTrustLevel,
    trustStability,
    trustConfidence: authority.confidence,
    trustVolatility,
    trustReadiness,
    trustState: authority.trustState,
  };

  setCachedEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetTrustRuntimeEvaluatorForTests(): void {
  evaluationCount = 0;
}
