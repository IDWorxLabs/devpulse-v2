/**
 * UX Heuristic Evaluator — final evaluation.
 */

import type { UXHeuristicAuthority, UXHeuristicEvaluation } from './ux-heuristic-types.js';
import { getCachedUXHeuristicEvaluation, setCachedUXHeuristicEvaluation } from './ux-heuristic-cache.js';

let evaluationCount = 0;

const RESULT_READINESS: Record<UXHeuristicEvaluation['uxHeuristicResult'], number> = {
  PASS: 95,
  PASS_WITH_WARNINGS: 72,
  FAIL: 25,
};

export function evaluateUXHeuristic(authority: UXHeuristicAuthority): UXHeuristicEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.overallScore,
    authority.uxHeuristicResult,
    authority.confidence,
  ].join('|');

  const cached = getCachedUXHeuristicEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: UXHeuristicEvaluation = {
    overallScore: authority.overallScore,
    uxHeuristicResult: authority.uxHeuristicResult,
    confidence: authority.confidence,
    founderAcceptanceReadiness: Math.round(
      (RESULT_READINESS[authority.uxHeuristicResult] + authority.founderUsabilityScore) / 2,
    ),
    navigationClarityScore: authority.navigationClarityScore,
    featureDiscoverabilityScore: authority.featureDiscoverabilityScore,
    actionClarityScore: authority.actionClarityScore,
    feedbackQualityScore: authority.feedbackQualityScore,
    systemStatusVisibilityScore: authority.systemStatusVisibilityScore,
    errorPreventionScore: authority.errorPreventionScore,
    userControlScore: authority.userControlScore,
    cognitiveLoadScore: authority.cognitiveLoadScore,
    trustClarityScore: authority.trustClarityScore,
    workflowContinuityScore: authority.workflowContinuityScore,
    intelligenceVisibilityScore: authority.intelligenceVisibilityScore,
    founderUsabilityScore: authority.founderUsabilityScore,
  };

  setCachedUXHeuristicEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetUXHeuristicEvaluatorForTests(): void {
  evaluationCount = 0;
}
