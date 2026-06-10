/**
 * Reality Verification Expansion — reality verification evaluator.
 */

import type {
  ClaimSupportStatus,
  RealityConflict,
  RealityVerificationEvaluation,
  UnifiedRealityAuthority,
} from './reality-verification-types.js';
import { getCachedRealityEvaluation, setCachedRealityEvaluation } from './reality-verification-cache.js';

let evaluationCount = 0;

const STATE_WEIGHT: Record<ClaimSupportStatus, number> = {
  SUPPORTED: 95,
  PARTIALLY_SUPPORTED: 60,
  UNSUPPORTED: 20,
  CONTRADICTED: 5,
};

export function evaluateRealityVerification(
  authority: UnifiedRealityAuthority,
  conflicts: RealityConflict[],
): RealityVerificationEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.overallRealityState,
    authority.verificationReadiness,
    conflicts.length,
  ].join('|');

  const cached = getCachedRealityEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const realityConfidence = Math.max(
    0,
    Math.min(100, Math.round(
      authority.verificationReadiness - conflicts.length * 5 + authority.consistency.consistencyScore * 0.2,
    )),
  );

  const realityTrustworthiness = Math.max(
    0,
    Math.min(100, Math.round(
      authority.consistency.agreementScore * 0.4 + authority.consistency.stabilityScore * 0.4
      - authority.contradictedCount * 10,
    )),
  );

  const realityReadiness = Math.round(
    (STATE_WEIGHT[authority.overallRealityState] + authority.verificationReadiness) / 2,
  );

  const realityStability = Math.max(
    0,
    Math.min(100, Math.round(authority.consistency.stabilityScore - authority.gapCount * 2)),
  );

  const result: RealityVerificationEvaluation = {
    realityConfidence,
    realityTrustworthiness,
    realityReadiness,
    realityStability,
    overallRealityState: authority.overallRealityState,
  };

  setCachedRealityEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetRealityVerificationEvaluatorForTests(): void {
  evaluationCount = 0;
}
