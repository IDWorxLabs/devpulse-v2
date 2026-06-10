/**
 * Founder Productivity Validation — manual work reduction validator.
 */

import type { FounderProductivityValidationInput, ManualWorkReductionValidation } from './founder-productivity-types.js';
import { MANUAL_WORK_REDUCTION_PASS, clampScore } from './founder-productivity-types.js';
import { boundGaps, createProductivityGap } from './productivity-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-productivity-cache.js';

export interface ManualWorkReductionUpstream {
  founderUsabilityScore: number;
  cognitiveLoadScore: number;
  operatorFeedPresent: boolean;
  automationSurfaceScore: number;
}

let validateCount = 0;

export function validateManualWorkReduction(
  input: FounderProductivityValidationInput,
  upstream: ManualWorkReductionUpstream,
): ManualWorkReductionValidation {
  const cacheKey = [input.requestId, upstream.founderUsabilityScore, input.manualWorkHigh].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === MANUAL_WORK_REDUCTION_PASS) return cached as ManualWorkReductionValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const feedBonus = upstream.operatorFeedPresent ? 6 : 0;
  const baseScore = Math.round(
    (upstream.founderUsabilityScore + (100 - upstream.cognitiveLoadScore) + upstream.automationSurfaceScore) / 3 + feedBonus,
  );

  if (input.manualWorkHigh === true || input.repetitiveWork === true || input.coordinationBurden === true || baseScore < 70) {
    detectionCodes.push('MANUAL_WORK_REDUCTION');
    gaps.push(createProductivityGap({
      title: 'Manual effort not sufficiently reduced',
      description: 'Repetitive work, manual coordination, or operational burden remains high for founder',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'MANUAL_WORK_REDUCTION',
      sourceValidator: 'manual-work-reduction-validator',
      productivityContext: 'AUTOMATION_PRODUCTIVITY',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ManualWorkReductionValidation = {
    validatorType: 'MANUAL_WORK_REDUCTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: MANUAL_WORK_REDUCTION_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getManualWorkValidateCount(): number {
  return validateCount;
}

export function resetManualWorkReductionValidatorForTests(): void {
  validateCount = 0;
}
