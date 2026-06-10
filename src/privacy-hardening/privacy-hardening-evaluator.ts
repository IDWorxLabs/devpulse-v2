/**
 * Privacy Hardening — privacy hardening evaluator.
 */

import type {
  PrivacyHardeningEvaluation,
  UnifiedPrivacyHardeningAuthority,
} from './privacy-hardening-types.js';
import { getCachedPrivacyEvaluation, setCachedPrivacyEvaluation } from './privacy-hardening-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<PrivacyHardeningEvaluation['state'], number> = {
  PRIVATE: 95,
  ACCEPTABLE: 80,
  WATCH: 65,
  EXPOSED: 45,
  UNSAFE: 25,
  BLOCKED: 0,
};

export function evaluatePrivacyHardening(
  authority: UnifiedPrivacyHardeningAuthority,
): PrivacyHardeningEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.privacyScore,
    authority.state,
    authority.riskLevel,
  ].join('|');

  const cached = getCachedPrivacyEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: PrivacyHardeningEvaluation = {
    privacyScore: authority.privacyScore,
    dataBoundaryScore: authority.dataBoundaryScore,
    retentionScore: authority.retentionScore,
    disclosureRiskScore: authority.disclosureRiskScore,
    state: authority.state,
    riskLevel: authority.riskLevel,
    confidence: authority.confidence,
    hardeningReadiness: Math.round((STATE_READINESS[authority.state] + authority.confidence) / 2),
  };

  setCachedPrivacyEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetPrivacyHardeningEvaluatorForTests(): void {
  evaluationCount = 0;
}
