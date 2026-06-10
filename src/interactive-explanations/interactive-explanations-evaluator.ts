/**
 * Interactive Explanations — evaluator.
 */

import type {
  InteractiveExplanationsEvaluation,
  UnifiedInteractiveExplanationsAuthority,
} from './interactive-explanations-types.js';
import {
  getCachedInteractiveExplanationsEvaluation,
  setCachedInteractiveExplanationsEvaluation,
} from './interactive-explanations-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<InteractiveExplanationsEvaluation['state'], number> = {
  READY: 95,
  PARTIAL: 70,
  INCOMPLETE: 40,
  UNKNOWN: 10,
};

export function evaluateInteractiveExplanations(
  authority: UnifiedInteractiveExplanationsAuthority,
): InteractiveExplanationsEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.explanationCoverageScore,
    authority.state,
    authority.coverageLevel,
  ].join('|');

  const cached = getCachedInteractiveExplanationsEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: InteractiveExplanationsEvaluation = {
    explanationCoverageScore: authority.explanationCoverageScore,
    workflowCoverageScore: authority.workflowCoverageScore,
    reasoningCoverageScore: authority.reasoningCoverageScore,
    reportCoverageScore: authority.reportCoverageScore,
    guidanceCoverageScore: authority.guidanceCoverageScore,
    coverageLevel: authority.coverageLevel,
    state: authority.state,
    confidence: authority.confidence,
    explanationReadiness: Math.round(
      (STATE_READINESS[authority.state] + authority.confidence) / 2,
    ),
  };

  setCachedInteractiveExplanationsEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetInteractiveExplanationsEvaluatorForTests(): void {
  evaluationCount = 0;
}
