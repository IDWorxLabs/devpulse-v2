/**
 * Founder Confidence Engine — next-step confidence validator.
 */

import type { FounderConfidenceEngineInput, NextStepConfidenceValidation } from './founder-confidence-types.js';
import { NEXT_STEP_CONFIDENCE_PASS, clampScore } from './founder-confidence-types.js';
import { boundGaps, createConfidenceGap } from './confidence-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-confidence-cache.js';

export interface NextStepConfidenceUpstream {
  actionReadinessScore: number;
  previewNextActionScore: number;
  workflowOutcomeScore: number;
  priorityClarityScore: number;
}

let validateCount = 0;

export function validateNextStepConfidence(
  input: FounderConfidenceEngineInput,
  upstream: NextStepConfidenceUpstream,
): NextStepConfidenceValidation {
  const cacheKey = [input.requestId, upstream.actionReadinessScore, input.nextStepUnclear].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === NEXT_STEP_CONFIDENCE_PASS) return cached as NextStepConfidenceValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.actionReadinessScore + upstream.previewNextActionScore + upstream.workflowOutcomeScore) / 3,
  );

  if (input.nextStepUnclear === true || baseScore < 72) {
    detectionCodes.push('NEXT_STEP_CONFIDENCE');
    gaps.push(createConfidenceGap({
      title: 'Founder lacks confidence in what to do next',
      description: 'Next action clarity, priority order, or validation command clarity insufficient',
      severity: baseScore < 58 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'NEXT_STEP_CONFIDENCE',
      sourceValidator: 'next-step-confidence-validator',
      confidenceContext: 'NEXT_STEP_CONFIDENCE',
    }));
  }
  if (upstream.priorityClarityScore < 65) {
    gaps.push(createConfidenceGap({
      title: 'Priority order not clear for next steps',
      description: 'Founder cannot determine which action to take first or what risks to consider',
      severity: 'MAJOR',
      detectionCode: 'NEXT_STEP_CONFIDENCE_GAPS',
      sourceValidator: 'next-step-confidence-validator',
      confidenceContext: 'NEXT_STEP_CONFIDENCE',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: NextStepConfidenceValidation = {
    validatorType: 'NEXT_STEP_CONFIDENCE',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: NEXT_STEP_CONFIDENCE_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getNextStepValidateCount(): number {
  return validateCount;
}

export function resetNextStepConfidenceValidatorForTests(): void {
  validateCount = 0;
}
