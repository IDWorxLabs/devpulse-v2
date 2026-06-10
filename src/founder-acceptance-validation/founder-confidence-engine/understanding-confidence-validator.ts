/**
 * Founder Confidence Engine — understanding confidence validator.
 */

import type { FounderConfidenceEngineInput, UnderstandingConfidenceValidation } from './founder-confidence-types.js';
import { UNDERSTANDING_CONFIDENCE_PASS, clampScore } from './founder-confidence-types.js';
import { boundGaps, createConfidenceGap } from './confidence-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-confidence-cache.js';

export interface UnderstandingConfidenceUpstream {
  projectContextScore: number;
  founderUsabilityScore: number;
  workflowContinuityScore: number;
  frameworkComplete: boolean;
}

let validateCount = 0;

export function validateUnderstandingConfidence(
  input: FounderConfidenceEngineInput,
  upstream: UnderstandingConfidenceUpstream,
): UnderstandingConfidenceValidation {
  const cacheKey = [input.requestId, upstream.projectContextScore, input.understandingWeak].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === UNDERSTANDING_CONFIDENCE_PASS) return cached as UnderstandingConfidenceValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.projectContextScore + upstream.founderUsabilityScore + upstream.workflowContinuityScore) / 3,
  );

  if (input.understandingWeak === true || baseScore < 75) {
    detectionCodes.push('UNDERSTANDING_CONFIDENCE');
    gaps.push(createConfidenceGap({
      title: 'Founder lacks confidence DevPulse understands the project',
      description: 'Project context, current phase, founder goal, or intended outcome not clearly reflected',
      severity: baseScore < 60 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'UNDERSTANDING_CONFIDENCE',
      sourceValidator: 'understanding-confidence-validator',
      confidenceContext: 'PROJECT_UNDERSTANDING_CONFIDENCE',
    }));
  }
  if (!upstream.frameworkComplete) {
    gaps.push(createConfidenceGap({
      title: 'Acceptance framework incomplete for project understanding',
      description: 'Founder acceptance framework not fully established for context signals',
      severity: 'MAJOR',
      detectionCode: 'UNDERSTANDING_CONFIDENCE_GAPS',
      sourceValidator: 'understanding-confidence-validator',
      confidenceContext: 'PROJECT_UNDERSTANDING_CONFIDENCE',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: UnderstandingConfidenceValidation = {
    validatorType: 'UNDERSTANDING_CONFIDENCE',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: UNDERSTANDING_CONFIDENCE_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getUnderstandingValidateCount(): number {
  return validateCount;
}

export function resetUnderstandingConfidenceValidatorForTests(): void {
  validateCount = 0;
}
