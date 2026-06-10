/**
 * Founder Confidence Engine — founder control confidence validator.
 */

import type { FounderConfidenceEngineInput, FounderControlConfidenceValidation } from './founder-confidence-types.js';
import { FOUNDER_CONTROL_CONFIDENCE_PASS, clampScore } from './founder-confidence-types.js';
import { boundGaps, createConfidenceGap } from './confidence-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-confidence-cache.js';

export interface FounderControlConfidenceUpstream {
  userControlScore: number;
  errorPreventionScore: number;
  readOnlyValidation: boolean;
  rollbackVisible: boolean;
}

let validateCount = 0;

export function validateFounderControlConfidence(
  input: FounderConfidenceEngineInput,
  upstream: FounderControlConfidenceUpstream,
): FounderControlConfidenceValidation {
  const cacheKey = [input.requestId, upstream.userControlScore, input.controlBoundaryWeak].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === FOUNDER_CONTROL_CONFIDENCE_PASS) return cached as FounderControlConfidenceValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round((upstream.userControlScore + upstream.errorPreventionScore) / 2);

  if (input.controlBoundaryWeak === true || baseScore < 72) {
    detectionCodes.push('FOUNDER_CONTROL_CONFIDENCE');
    gaps.push(createConfidenceGap({
      title: 'Founder control boundaries unclear',
      description: 'Approval boundaries, rollback visibility, or safety controls not clear to founder',
      severity: baseScore < 58 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'FOUNDER_CONTROL_CONFIDENCE',
      sourceValidator: 'founder-control-confidence-validator',
      confidenceContext: 'CONTROL_CONFIDENCE',
    }));
  }
  if (!upstream.readOnlyValidation) {
    gaps.push(createConfidenceGap({
      title: 'Validation may mutate state unexpectedly',
      description: 'Founder cannot be confident validation remains read-only without hidden execution',
      severity: 'CRITICAL',
      detectionCode: 'FOUNDER_CONTROL_CONFIDENCE_GAPS',
      sourceValidator: 'founder-control-confidence-validator',
      confidenceContext: 'CONTROL_CONFIDENCE',
    }));
  }
  if (!upstream.rollbackVisible) {
    gaps.push(createConfidenceGap({
      title: 'Rollback and safety visibility insufficient',
      description: 'Founder cannot see rollback paths or safety boundaries for actions',
      severity: 'MINOR',
      detectionCode: 'FOUNDER_CONTROL_CONFIDENCE_GAPS',
      sourceValidator: 'founder-control-confidence-validator',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: FounderControlConfidenceValidation = {
    validatorType: 'FOUNDER_CONTROL_CONFIDENCE',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: FOUNDER_CONTROL_CONFIDENCE_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getControlValidateCount(): number {
  return validateCount;
}

export function resetFounderControlConfidenceValidatorForTests(): void {
  validateCount = 0;
}
