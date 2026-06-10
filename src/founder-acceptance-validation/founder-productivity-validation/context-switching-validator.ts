/**
 * Founder Productivity Validation — context switching validator.
 */

import type { FounderProductivityValidationInput, ContextSwitchingValidation } from './founder-productivity-types.js';
import { CONTEXT_SWITCHING_PASS, clampScore } from './founder-productivity-types.js';
import { boundGaps, createProductivityGap } from './productivity-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-productivity-cache.js';

export interface ContextSwitchingUpstream {
  workflowContinuityScore: number;
  experienceContinuityScore: number;
  contextLossRisk: boolean;
  fragmentationScore: number;
}

let validateCount = 0;

export function validateContextSwitching(
  input: FounderProductivityValidationInput,
  upstream: ContextSwitchingUpstream,
): ContextSwitchingValidation {
  const cacheKey = [input.requestId, upstream.workflowContinuityScore, input.contextSwitchingHigh].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === CONTEXT_SWITCHING_PASS) return cached as ContextSwitchingValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.workflowContinuityScore + upstream.experienceContinuityScore + upstream.fragmentationScore) / 3,
  );

  if (input.contextSwitchingHigh === true || upstream.contextLossRisk || baseScore < 72) {
    detectionCodes.push('CONTEXT_SWITCHING_PRODUCTIVITY');
    gaps.push(createProductivityGap({
      title: 'Context switching reduces founder productivity',
      description: 'Workflow focus, operational continuity, or fragmentation undermines founder efficiency',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'CONTEXT_SWITCHING_PRODUCTIVITY',
      sourceValidator: 'context-switching-validator',
      productivityContext: 'PROJECT_MANAGEMENT_PRODUCTIVITY',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ContextSwitchingValidation = {
    validatorType: 'CONTEXT_SWITCHING_PRODUCTIVITY',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: CONTEXT_SWITCHING_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getContextSwitchValidateCount(): number {
  return validateCount;
}

export function resetContextSwitchingValidatorForTests(): void {
  validateCount = 0;
}
