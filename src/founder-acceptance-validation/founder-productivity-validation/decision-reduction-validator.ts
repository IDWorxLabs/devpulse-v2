/**
 * Founder Productivity Validation — decision reduction validator.
 */

import type { FounderProductivityValidationInput, DecisionReductionValidation } from './founder-productivity-types.js';
import { DECISION_REDUCTION_PASS, clampScore } from './founder-productivity-types.js';
import { boundGaps, createProductivityGap } from './productivity-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-productivity-cache.js';

export interface DecisionReductionUpstream {
  decisionConfidenceScore: number;
  founderPriorityCount: number;
  nextStepConfidenceScore: number;
  trustClarityScore: number;
}

let validateCount = 0;

export function validateDecisionReduction(
  input: FounderProductivityValidationInput,
  upstream: DecisionReductionUpstream,
): DecisionReductionValidation {
  const cacheKey = [input.requestId, upstream.decisionConfidenceScore, input.decisionFatigue].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === DECISION_REDUCTION_PASS) return cached as DecisionReductionValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const priorityBonus = upstream.founderPriorityCount > 0 ? 5 : -8;
  const baseScore = Math.round(
    (upstream.decisionConfidenceScore + upstream.nextStepConfidenceScore + upstream.trustClarityScore) / 3 + priorityBonus,
  );

  if (input.decisionFatigue === true || baseScore < 70) {
    detectionCodes.push('DECISION_REDUCTION');
    gaps.push(createProductivityGap({
      title: 'Decision fatigue not sufficiently reduced',
      description: 'Founder faces repeated decisions, weak prioritization, or low recommendation quality',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'DECISION_REDUCTION',
      sourceValidator: 'decision-reduction-validator',
      productivityContext: 'DECISION_PRODUCTIVITY',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: DecisionReductionValidation = {
    validatorType: 'DECISION_REDUCTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: DECISION_REDUCTION_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getDecisionValidateCount(): number {
  return validateCount;
}

export function resetDecisionReductionValidatorForTests(): void {
  validateCount = 0;
}
