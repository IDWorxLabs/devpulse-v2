/**
 * Founder Confidence Engine — uncertainty honesty validator.
 */

import type { FounderConfidenceEngineInput, UncertaintyHonestyValidation } from './founder-confidence-types.js';
import { UNCERTAINTY_HONESTY_PASS, clampScore } from './founder-confidence-types.js';
import { boundGaps, createConfidenceGap } from './confidence-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-confidence-cache.js';

export interface UncertaintyHonestyUpstream {
  previewHonestyScore: number;
  errorPreventionScore: number;
  limitationVisibilityScore: number;
  evidenceGapCount: number;
}

let validateCount = 0;

export function validateUncertaintyHonesty(
  input: FounderConfidenceEngineInput,
  upstream: UncertaintyHonestyUpstream,
): UncertaintyHonestyValidation {
  const cacheKey = [input.requestId, upstream.previewHonestyScore, input.uncertaintyHidden].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === UNCERTAINTY_HONESTY_PASS) return cached as UncertaintyHonestyValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.previewHonestyScore + upstream.errorPreventionScore + upstream.limitationVisibilityScore) / 3
      - upstream.evidenceGapCount * 3,
  );

  if (input.uncertaintyHidden === true || input.missingEvidence === true || baseScore < 70) {
    detectionCodes.push('UNCERTAINTY_HONESTY');
    gaps.push(createConfidenceGap({
      title: 'DevPulse does not admit uncertainty honestly',
      description: 'Uncertain claims unmarked, missing evidence unacknowledged, or confidence inflated',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'UNCERTAINTY_HONESTY',
      sourceValidator: 'uncertainty-honesty-validator',
      confidenceContext: 'UNCERTAINTY_CONFIDENCE',
    }));
  }
  if (upstream.evidenceGapCount > 2) {
    gaps.push(createConfidenceGap({
      title: 'Missing evidence not acknowledged',
      description: 'System gaps in evidence not surfaced to founder as limitations',
      severity: 'MAJOR',
      detectionCode: 'UNCERTAINTY_HONESTY_GAPS',
      sourceValidator: 'uncertainty-honesty-validator',
      confidenceContext: 'UNCERTAINTY_CONFIDENCE',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: UncertaintyHonestyValidation = {
    validatorType: 'UNCERTAINTY_HONESTY',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: UNCERTAINTY_HONESTY_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getUncertaintyValidateCount(): number {
  return validateCount;
}

export function resetUncertaintyHonestyValidatorForTests(): void {
  validateCount = 0;
}
