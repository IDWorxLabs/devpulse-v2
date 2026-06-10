/**
 * Founder Trust Validation — safety boundary validator.
 */

import type { FounderTrustValidationInput, SafetyBoundaryValidation } from './founder-trust-types.js';
import { SAFETY_TRUST_PASS, clampScore } from './founder-trust-types.js';
import { boundGaps, createTrustGap } from './trust-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-trust-cache.js';

export interface SafetyBoundaryUpstream {
  userControlScore: number;
  errorPreventionScore: number;
  readOnlyValidation: boolean;
  founderControlScore: number;
}

let validateCount = 0;

export function validateSafetyBoundaries(
  input: FounderTrustValidationInput,
  upstream: SafetyBoundaryUpstream,
): SafetyBoundaryValidation {
  const cacheKey = [input.requestId, upstream.userControlScore, input.safetyBoundaryWeak].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === SAFETY_TRUST_PASS) return cached as SafetyBoundaryValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.userControlScore + upstream.errorPreventionScore + upstream.founderControlScore) / 3,
  );

  if (input.safetyBoundaryWeak === true || input.hiddenExecution === true || baseScore < 72) {
    detectionCodes.push('SAFETY_TRUST');
    gaps.push(createTrustGap({
      title: 'Safety boundaries may not be visible or preserved',
      description: 'Hidden execution, silent mutation, or risk visibility gaps undermine founder control',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'SAFETY_TRUST',
      sourceValidator: 'safety-boundary-validator',
      trustContext: 'SAFETY_TRUST',
    }));
  }
  if (!upstream.readOnlyValidation) {
    gaps.push(createTrustGap({
      title: 'Read-only safety boundary not guaranteed',
      description: 'Trust validation cannot confirm no silent mutation during evaluation',
      severity: 'CRITICAL',
      detectionCode: 'SAFETY_TRUST_GAPS',
      sourceValidator: 'safety-boundary-validator',
      trustContext: 'SAFETY_TRUST',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: SafetyBoundaryValidation = {
    validatorType: 'SAFETY_TRUST',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: SAFETY_TRUST_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getSafetyValidateCount(): number {
  return validateCount;
}

export function resetSafetyBoundaryValidatorForTests(): void {
  validateCount = 0;
}
