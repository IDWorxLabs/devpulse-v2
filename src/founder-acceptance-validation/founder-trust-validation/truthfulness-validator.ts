/**
 * Founder Trust Validation — truthfulness validator.
 */

import type { FounderTrustValidationInput, TruthfulnessValidation } from './founder-trust-types.js';
import { TRUTHFULNESS_TRUST_PASS, clampScore } from './founder-trust-types.js';
import { boundGaps, createTrustGap } from './trust-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-trust-cache.js';

export interface TruthfulnessUpstream {
  progressTruthScore: number;
  productRealityScore: number;
  launchBlockerCount: number;
  confidenceProgressScore: number;
}

let validateCount = 0;

export function validateTruthfulness(
  input: FounderTrustValidationInput,
  upstream: TruthfulnessUpstream,
): TruthfulnessValidation {
  const cacheKey = [input.requestId, upstream.progressTruthScore, input.truthfulnessWeak].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === TRUTHFULNESS_TRUST_PASS) return cached as TruthfulnessValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.progressTruthScore + upstream.productRealityScore + upstream.confidenceProgressScore) / 3
      - upstream.launchBlockerCount * 2,
  );

  if (input.truthfulnessWeak === true || input.unsupportedPassClaims === true || baseScore < 72) {
    detectionCodes.push('TRUTHFULNESS_TRUST');
    gaps.push(createTrustGap({
      title: 'Completion or status claims may not be truthful',
      description: 'Progress claims lack evidence backing or limitations are not disclosed',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'TRUTHFULNESS_TRUST',
      sourceValidator: 'truthfulness-validator',
      trustContext: 'TRUTHFULNESS_TRUST',
    }));
  }
  if (upstream.launchBlockerCount > 2) {
    gaps.push(createTrustGap({
      title: 'Progress may be inflated relative to remaining work',
      description: 'Launch blockers present but progress reporting may overstate readiness',
      severity: 'MAJOR',
      detectionCode: 'TRUTHFULNESS_GAPS',
      sourceValidator: 'truthfulness-validator',
      trustContext: 'TRUTHFULNESS_TRUST',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: TruthfulnessValidation = {
    validatorType: 'TRUTHFULNESS_TRUST',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: TRUTHFULNESS_TRUST_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getTruthfulnessValidateCount(): number {
  return validateCount;
}

export function resetTruthfulnessValidatorForTests(): void {
  validateCount = 0;
}
