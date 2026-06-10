/**
 * Founder Trust Validation — transparency validator.
 */

import type { FounderTrustValidationInput, TransparencyValidation } from './founder-trust-types.js';
import { TRANSPARENCY_TRUST_PASS, clampScore } from './founder-trust-types.js';
import { boundGaps, createTrustGap } from './trust-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-trust-cache.js';

export interface TransparencyUpstream {
  trustClarityScore: number;
  feedbackQualityScore: number;
  operatorFeedPresent: boolean;
  feedStreamPresent: boolean;
  reasoningVisibilityScore: number;
}

let validateCount = 0;

export function validateTransparency(
  input: FounderTrustValidationInput,
  upstream: TransparencyUpstream,
): TransparencyValidation {
  const cacheKey = [input.requestId, upstream.trustClarityScore, input.transparencyWeak].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === TRANSPARENCY_TRUST_PASS) return cached as TransparencyValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.trustClarityScore + upstream.feedbackQualityScore + upstream.reasoningVisibilityScore) / 3,
  );

  if (input.transparencyWeak === true || baseScore < 72) {
    detectionCodes.push('TRANSPARENCY_TRUST');
    gaps.push(createTrustGap({
      title: 'Decisions and results not sufficiently visible',
      description: 'Founder cannot see decisions, failures, assumptions, or next steps clearly',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'TRANSPARENCY_TRUST',
      sourceValidator: 'transparency-validator',
      trustContext: 'TRANSPARENCY_TRUST',
    }));
  }
  if (!upstream.operatorFeedPresent || !upstream.feedStreamPresent) {
    gaps.push(createTrustGap({
      title: 'Operator feed transparency insufficient',
      description: 'Results and failures not visible through operator feed stream',
      severity: 'MINOR',
      detectionCode: 'TRANSPARENCY_GAPS',
      sourceValidator: 'transparency-validator',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 4);
  const result: TransparencyValidation = {
    validatorType: 'TRANSPARENCY_TRUST',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: TRANSPARENCY_TRUST_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getTransparencyValidateCount(): number {
  return validateCount;
}

export function resetTransparencyValidatorForTests(): void {
  validateCount = 0;
}
