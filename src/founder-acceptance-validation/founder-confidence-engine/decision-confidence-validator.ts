/**
 * Founder Confidence Engine — decision confidence validator.
 */

import type { FounderConfidenceEngineInput, DecisionConfidenceValidation } from './founder-confidence-types.js';
import { DECISION_CONFIDENCE_PASS, clampScore } from './founder-confidence-types.js';
import { boundGaps, createConfidenceGap } from './confidence-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-confidence-cache.js';

export interface DecisionConfidenceUpstream {
  userControlScore: number;
  trustClarityScore: number;
  authorityConflictCount: number;
  founderPriorityCount: number;
}

let validateCount = 0;

export function validateDecisionConfidence(
  input: FounderConfidenceEngineInput,
  upstream: DecisionConfidenceUpstream,
): DecisionConfidenceValidation {
  const cacheKey = [input.requestId, upstream.userControlScore, input.decisionUnsupported].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === DECISION_CONFIDENCE_PASS) return cached as DecisionConfidenceValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.userControlScore + upstream.trustClarityScore) / 2 - upstream.authorityConflictCount * 4,
  );

  if (input.decisionUnsupported === true || baseScore < 70) {
    detectionCodes.push('DECISION_CONFIDENCE');
    gaps.push(createConfidenceGap({
      title: 'Founder decisions not adequately supported',
      description: 'Tradeoffs, assumptions, or recommendation justification not visible to founder',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'DECISION_CONFIDENCE',
      sourceValidator: 'decision-confidence-validator',
      confidenceContext: 'DECISION_CONFIDENCE',
    }));
  }
  if (upstream.authorityConflictCount > 0) {
    gaps.push(createConfidenceGap({
      title: 'Authority conflicts undermine decision confidence',
      description: 'Conflicting authority signals make founder decisions harder to trust',
      severity: 'MAJOR',
      detectionCode: 'DECISION_CONFIDENCE_GAPS',
      sourceValidator: 'decision-confidence-validator',
      confidenceContext: 'DECISION_CONFIDENCE',
    }));
  }
  if (upstream.founderPriorityCount === 0) {
    gaps.push(createConfidenceGap({
      title: 'No visible founder priorities for decisions',
      description: 'Alternatives and priority guidance not surfaced for founder decision support',
      severity: 'MINOR',
      detectionCode: 'DECISION_CONFIDENCE_GAPS',
      sourceValidator: 'decision-confidence-validator',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 4);
  const result: DecisionConfidenceValidation = {
    validatorType: 'DECISION_CONFIDENCE',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: DECISION_CONFIDENCE_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getDecisionValidateCount(): number {
  return validateCount;
}

export function resetDecisionConfidenceValidatorForTests(): void {
  validateCount = 0;
}
