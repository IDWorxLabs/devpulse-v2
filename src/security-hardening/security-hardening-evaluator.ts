/**
 * Security Hardening — security hardening evaluator.
 */

import type {
  SecurityHardeningEvaluation,
  UnifiedSecurityHardeningAuthority,
} from './security-hardening-types.js';
import { getCachedSecurityEvaluation, setCachedSecurityEvaluation } from './security-hardening-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<SecurityHardeningEvaluation['state'], number> = {
  SECURE: 95,
  ACCEPTABLE: 80,
  WATCH: 65,
  EXPOSED: 45,
  UNSAFE: 25,
  BLOCKED: 0,
};

export function evaluateSecurityHardening(
  authority: UnifiedSecurityHardeningAuthority,
): SecurityHardeningEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.securityScore,
    authority.state,
    authority.riskLevel,
  ].join('|');

  const cached = getCachedSecurityEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: SecurityHardeningEvaluation = {
    securityScore: authority.securityScore,
    boundaryScore: authority.boundaryScore,
    isolationScore: authority.isolationScore,
    exposureScore: authority.exposureScore,
    state: authority.state,
    riskLevel: authority.riskLevel,
    confidence: authority.confidence,
    hardeningReadiness: Math.round((STATE_READINESS[authority.state] + authority.confidence) / 2),
  };

  setCachedSecurityEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetSecurityHardeningEvaluatorForTests(): void {
  evaluationCount = 0;
}
