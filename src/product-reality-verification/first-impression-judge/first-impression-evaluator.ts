/**
 * First-Impression Judge — final evaluation.
 */

import type { FirstImpressionAuthority, FirstImpressionEvaluation } from './first-impression-types.js';
import { getCachedFirstImpressionEvaluation, setCachedFirstImpressionEvaluation } from './first-impression-cache.js';

let evaluationCount = 0;

const RESULT_READINESS: Record<FirstImpressionEvaluation['firstImpressionResult'], number> = {
  PASS: 95,
  PASS_WITH_WARNINGS: 72,
  FAIL: 25,
};

const STAGE_VERDICT: Record<string, string> = {
  internal_alpha: 'Perceived as internal alpha — not ready for external first impressions',
  founder_alpha: 'Perceived as founder alpha — suitable for founder acceptance testing',
  beta: 'Perceived as beta — approaching external readiness with noted gaps',
  production_ready: 'Perceived as production-ready for first-time viewers',
};

export function evaluateFirstImpression(
  authority: FirstImpressionAuthority,
  perceivedStage: string,
): FirstImpressionEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.overallScore,
    authority.firstImpressionResult,
    perceivedStage,
  ].join('|');

  const cached = getCachedFirstImpressionEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: FirstImpressionEvaluation = {
    overallScore: authority.overallScore,
    firstImpressionResult: authority.firstImpressionResult,
    confidence: authority.confidence,
    launchReadinessVerdict: STAGE_VERDICT[perceivedStage] ?? STAGE_VERDICT.founder_alpha,
    productClarityScore: authority.productClarityScore,
    intelligencePerceptionScore: authority.intelligencePerceptionScore,
    trustworthinessScore: authority.trustworthinessScore,
    visualConfidenceScore: authority.visualConfidenceScore,
    founderUsefulnessScore: authority.founderUsefulnessScore,
    premiumFeelScore: authority.premiumFeelScore,
    actionReadinessScore: authority.actionReadinessScore,
    productIdentityScore: authority.productIdentityScore,
    emotionalConfidenceScore: authority.emotionalConfidenceScore,
    launchReadinessPerceptionScore: authority.launchReadinessPerceptionScore,
  };

  setCachedFirstImpressionEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFirstImpressionEvaluationForTests(): void {
  evaluationCount = 0;
}
