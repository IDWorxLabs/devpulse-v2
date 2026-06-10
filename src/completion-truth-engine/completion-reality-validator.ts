/**
 * Completion Truth Engine — completion reality validator.
 */

import type {
  CompletionRealityValidation,
  RawCompletionClaimInput,
  RawCompletionRealityInput,
} from './completion-truth-types.js';
import { getCachedRealityValidation, setCachedRealityValidation } from './completion-truth-cache.js';

let realityValidationCount = 0;

export function validateCompletionReality(
  claims: RawCompletionClaimInput[],
  signals: RawCompletionRealityInput[] = [],
): CompletionRealityValidation {
  const cacheKey = [
    claims.map((c) => `${c.claimType}:${c.reportedComplete}`).join(','),
    signals.map((s) => `${s.realityComplete}:${s.verificationPresent}`).join(','),
  ].join('|');

  const cached = getCachedRealityValidation(cacheKey);
  if (cached) return cached;

  realityValidationCount += 1;
  const gaps: string[] = [];
  let score = 50;

  const reportedComplete = claims.some((c) => c.reportedComplete === true);
  const merged = signals[0] ?? {};

  if (reportedComplete && merged.realityComplete === false) {
    gaps.push('Claimed complete but reality incomplete');
    score -= 40;
  }
  if (reportedComplete && merged.verificationPresent === false) {
    gaps.push('Claimed complete but verification missing');
    score -= 25;
  }
  if (reportedComplete && merged.evidencePresent === false) {
    gaps.push('Claimed complete but evidence missing');
    score -= 25;
  }
  if (reportedComplete && merged.trustPresent === false) {
    gaps.push('Claimed complete but trust missing');
    score -= 20;
  }
  if ((merged.contradictions ?? 0) > 0) {
    gaps.push('Reality contradictions detected');
    score -= merged.contradictions! * 10;
  }

  if (merged.realityComplete === true) score += 20;
  if (merged.verificationPresent === true) score += 15;
  if (merged.evidencePresent === true) score += 15;
  if (merged.trustPresent === true) score += 10;
  if (merged.governanceApproved === true) score += 10;

  const result: CompletionRealityValidation = {
    realityCompletionScore: Math.max(0, Math.min(100, Math.round(score))),
    realityGaps: gaps,
  };

  setCachedRealityValidation(cacheKey, result);
  return result;
}

export function getRealityValidationCount(): number {
  return realityValidationCount;
}

export function resetCompletionRealityValidatorForTests(): void {
  realityValidationCount = 0;
}
