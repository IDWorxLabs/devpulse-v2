/**
 * Mobile Runtime Validation at Scale V1 — UVL mobile verification evidence.
 */

import type { MobileVerificationEvidence } from './mobile-runtime-validation-v1-types.js';
import { MIN_MOBILE_CATEGORY_COUNT } from './mobile-runtime-validation-v1-bounds.js';

export function buildMobileVerificationEvidence(input: {
  categoriesMobileProven: number;
  categoriesRequired?: number;
}): MobileVerificationEvidence {
  const required = input.categoriesRequired ?? MIN_MOBILE_CATEGORY_COUNT;
  const percent =
    required > 0 ? Math.round((input.categoriesMobileProven / required) * 100) : 0;
  const boost = percent >= 100 ? 15 : percent >= 80 ? 10 : percent >= 50 ? 5 : 0;

  return {
    readOnly: true,
    mobileCategoriesProven: input.categoriesMobileProven,
    mobileCategoriesRequired: required,
    mobileCoveragePercent: percent,
    verificationConfidenceBoost: boost,
    source: 'Mobile Runtime Validation at Scale V1',
  };
}

export function adjustUvlConfidenceForMobileProof(input: {
  baseConfidence: number;
  mobileEvidence: MobileVerificationEvidence;
}): number {
  return Math.min(100, input.baseConfidence + input.mobileEvidence.verificationConfidenceBoost);
}
