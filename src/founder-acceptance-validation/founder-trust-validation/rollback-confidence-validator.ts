/**
 * Founder Trust Validation — rollback confidence validator.
 */

import type { FounderTrustValidationInput, RollbackConfidenceValidation } from './founder-trust-types.js';
import { ROLLBACK_TRUST_PASS, clampScore } from './founder-trust-types.js';
import { boundGaps, createTrustGap } from './trust-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-trust-cache.js';

export interface RollbackConfidenceUpstream {
  errorPreventionScore: number;
  rollbackVisible: boolean;
  recoveryVisible: boolean;
  userControlScore: number;
}

let validateCount = 0;

export function validateRollbackConfidence(
  input: FounderTrustValidationInput,
  upstream: RollbackConfidenceUpstream,
): RollbackConfidenceValidation {
  const cacheKey = [input.requestId, upstream.errorPreventionScore, input.rollbackUnclear].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === ROLLBACK_TRUST_PASS) return cached as RollbackConfidenceValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const visibilityBonus = (upstream.rollbackVisible ? 6 : 0) + (upstream.recoveryVisible ? 6 : 0);
  const baseScore = Math.round(
    (upstream.errorPreventionScore + upstream.userControlScore) / 2 + visibilityBonus,
  );

  if (input.rollbackUnclear === true || baseScore < 70) {
    detectionCodes.push('ROLLBACK_TRUST');
    gaps.push(createTrustGap({
      title: 'Rollback and recovery paths not sufficiently visible',
      description: 'Founder cannot see checkpoint, rollback, or recovery confidence paths',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'ROLLBACK_TRUST',
      sourceValidator: 'rollback-confidence-validator',
      trustContext: 'ROLLBACK_TRUST',
    }));
  }
  if (!upstream.rollbackVisible) {
    gaps.push(createTrustGap({
      title: 'Rollback path not discoverable',
      description: 'Reversibility confidence undermined by hidden rollback paths',
      severity: 'MAJOR',
      detectionCode: 'ROLLBACK_TRUST_GAPS',
      sourceValidator: 'rollback-confidence-validator',
      trustContext: 'ROLLBACK_TRUST',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: RollbackConfidenceValidation = {
    validatorType: 'ROLLBACK_TRUST',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: ROLLBACK_TRUST_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getRollbackValidateCount(): number {
  return validateCount;
}

export function resetRollbackConfidenceValidatorForTests(): void {
  validateCount = 0;
}
