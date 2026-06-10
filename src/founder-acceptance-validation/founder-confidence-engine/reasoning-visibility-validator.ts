/**
 * Founder Confidence Engine — reasoning visibility validator.
 */

import type { FounderConfidenceEngineInput, ReasoningVisibilityValidation } from './founder-confidence-types.js';
import { REASONING_VISIBILITY_PASS, clampScore } from './founder-confidence-types.js';
import { boundGaps, createConfidenceGap } from './confidence-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-confidence-cache.js';

export interface ReasoningVisibilityUpstream {
  trustClarityScore: number;
  feedbackQualityScore: number;
  operatorFeedPresent: boolean;
  feedStreamPresent: boolean;
}

let validateCount = 0;

export function validateReasoningVisibility(
  input: FounderConfidenceEngineInput,
  upstream: ReasoningVisibilityUpstream,
): ReasoningVisibilityValidation {
  const cacheKey = [input.requestId, upstream.trustClarityScore, input.reasoningHidden].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === REASONING_VISIBILITY_PASS) return cached as ReasoningVisibilityValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round((upstream.trustClarityScore + upstream.feedbackQualityScore) / 2);

  if (input.reasoningHidden === true || baseScore < 72) {
    detectionCodes.push('REASONING_VISIBILITY');
    gaps.push(createConfidenceGap({
      title: 'DevPulse does not explain what it is doing clearly',
      description: 'Reasoning for actions, step necessity, and evidence support not visible to founder',
      severity: baseScore < 58 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'REASONING_VISIBILITY',
      sourceValidator: 'reasoning-visibility-validator',
      confidenceContext: 'ACTION_REASONING_CONFIDENCE',
    }));
  }
  if (input.vagueAuthorityClaims === true) {
    gaps.push(createConfidenceGap({
      title: 'Vague authority claims without evidence',
      description: 'System makes authority claims without explaining what evidence supports them',
      severity: 'MAJOR',
      detectionCode: 'REASONING_VISIBILITY_GAPS',
      sourceValidator: 'reasoning-visibility-validator',
      confidenceContext: 'ACTION_REASONING_CONFIDENCE',
    }));
  }
  if (!upstream.operatorFeedPresent || !upstream.feedStreamPresent) {
    gaps.push(createConfidenceGap({
      title: 'Action reasoning not visible in operator feed',
      description: 'Founder cannot see what changed or why through operator feed stream',
      severity: 'MINOR',
      detectionCode: 'REASONING_VISIBILITY_GAPS',
      sourceValidator: 'reasoning-visibility-validator',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 4);
  const result: ReasoningVisibilityValidation = {
    validatorType: 'REASONING_VISIBILITY',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: REASONING_VISIBILITY_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getReasoningValidateCount(): number {
  return validateCount;
}

export function resetReasoningVisibilityValidatorForTests(): void {
  validateCount = 0;
}
