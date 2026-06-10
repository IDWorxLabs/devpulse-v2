/**
 * Visual QA Engine — final evaluation.
 */

import type { VisualQAAuthority, VisualQAEvaluation } from './visual-qa-types.js';
import { getCachedVisualQAEvaluation, setCachedVisualQAEvaluation } from './visual-qa-cache.js';

let evaluationCount = 0;

const RESULT_READINESS: Record<VisualQAEvaluation['visualQaResult'], number> = {
  PASS: 95,
  PASS_WITH_WARNINGS: 72,
  FAIL: 25,
};

export function evaluateVisualQA(authority: VisualQAAuthority): VisualQAEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.overallScore,
    authority.visualQaResult,
    authority.confidence,
  ].join('|');

  const cached = getCachedVisualQAEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: VisualQAEvaluation = {
    overallScore: authority.overallScore,
    visualQaResult: authority.visualQaResult,
    confidence: authority.confidence,
    productionReadiness: Math.round(
      (RESULT_READINESS[authority.visualQaResult] + authority.confidence) / 2,
    ),
    hierarchyScore: authority.hierarchyScore,
    layoutScore: authority.layoutScore,
    spacingScore: authority.spacingScore,
    alignmentScore: authority.alignmentScore,
    typographyScore: authority.typographyScore,
    colorScore: authority.colorScore,
    clutterScore: authority.clutterScore,
    emptySpaceScore: authority.emptySpaceScore,
    mobileScore: authority.mobileScore,
    desktopScore: authority.desktopScore,
    firstImpressionScore: authority.firstImpressionScore,
    professionalismScore: authority.professionalismScore,
  };

  setCachedVisualQAEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetVisualQAEvaluatorForTests(): void {
  evaluationCount = 0;
}
