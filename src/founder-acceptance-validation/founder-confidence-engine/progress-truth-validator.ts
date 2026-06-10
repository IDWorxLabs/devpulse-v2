/**
 * Founder Confidence Engine — progress truth validator.
 */

import type { FounderConfidenceEngineInput, ProgressTruthValidation } from './founder-confidence-types.js';
import { PROGRESS_TRUTH_PASS, clampScore } from './founder-confidence-types.js';
import { boundGaps, createConfidenceGap } from './confidence-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-confidence-cache.js';

export interface ProgressTruthUpstream {
  productRealityScore: number;
  validationEvidenceScore: number;
  launchBlockerCount: number;
  releaseReadiness: string;
}

let validateCount = 0;

export function validateProgressTruth(
  input: FounderConfidenceEngineInput,
  upstream: ProgressTruthUpstream,
): ProgressTruthValidation {
  const cacheKey = [input.requestId, upstream.productRealityScore, input.progressInflated].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === PROGRESS_TRUTH_PASS) return cached as ProgressTruthValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.productRealityScore + upstream.validationEvidenceScore) / 2 - upstream.launchBlockerCount * 3,
  );

  if (input.progressInflated === true || input.unsupportedPassClaims === true || baseScore < 70) {
    detectionCodes.push('PROGRESS_TRUTH');
    gaps.push(createConfidenceGap({
      title: 'Progress claims may not be truthful or evidence-backed',
      description: 'Unsupported pass claims, fake completion, or unclear built/wired/validated distinction',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'PROGRESS_TRUTH',
      sourceValidator: 'progress-truth-validator',
      confidenceContext: 'PROGRESS_TRUTH_CONFIDENCE',
    }));
  }
  if (upstream.releaseReadiness === 'NOT_READY' && upstream.productRealityScore > 80) {
    gaps.push(createConfidenceGap({
      title: 'Score and readiness verdict conflict',
      description: 'High product reality score conflicts with not-ready release readiness',
      severity: 'MAJOR',
      detectionCode: 'PROGRESS_TRUTH_GAPS',
      sourceValidator: 'progress-truth-validator',
      confidenceContext: 'PROGRESS_TRUTH_CONFIDENCE',
    }));
  }
  if (upstream.launchBlockerCount > 2) {
    gaps.push(createConfidenceGap({
      title: 'Remaining work not accurately reported',
      description: 'Launch blockers present but progress reporting may understate remaining work',
      severity: 'MINOR',
      detectionCode: 'PROGRESS_TRUTH_GAPS',
      sourceValidator: 'progress-truth-validator',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ProgressTruthValidation = {
    validatorType: 'PROGRESS_TRUTH',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: PROGRESS_TRUTH_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getProgressTruthValidateCount(): number {
  return validateCount;
}

export function resetProgressTruthValidatorForTests(): void {
  validateCount = 0;
}
