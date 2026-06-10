/**
 * Founder Confidence Engine — evaluator.
 */

import type {
  FounderConfidenceAuthority,
  FounderConfidenceEvaluation,
  FounderConfidenceResult,
  FounderConfidenceScore,
} from './founder-confidence-types.js';
import { getCachedFounderConfidenceEvaluation, setCachedFounderConfidenceEvaluation } from './founder-confidence-cache.js';

let evaluationCount = 0;

const CONFIDENCE_VERDICT: Record<FounderConfidenceResult, string> = {
  PASS: 'DevPulse gives the founder confidence in system understanding, truthfulness, and control',
  PASS_WITH_WARNINGS: 'Founder confidence mostly supported — address confidence gaps before daily reliance',
  FAIL: 'Founder confidence has critical gaps — progress claims and reasoning not trustworthy',
};

export function buildFounderConfidenceScore(authority: FounderConfidenceAuthority): FounderConfidenceScore {
  return {
    overallScore: authority.founderConfidenceScore,
    understandingConfidenceScore: authority.understandingConfidence.score,
    reasoningVisibilityScore: authority.reasoningVisibility.score,
    progressTruthScore: authority.progressTruth.score,
    nextStepConfidenceScore: authority.nextStepConfidence.score,
    decisionConfidenceScore: authority.decisionConfidence.score,
    uncertaintyHonestyScore: authority.uncertaintyHonesty.score,
    founderControlConfidenceScore: authority.founderControlConfidence.score,
  };
}

export function evaluateFounderConfidence(authority: FounderConfidenceAuthority): FounderConfidenceEvaluation {
  const cacheKey = [authority.authorityId, authority.founderConfidenceScore, authority.founderConfidenceResult].join('|');
  const cached = getCachedFounderConfidenceEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;
  const scores = buildFounderConfidenceScore(authority);

  const result: FounderConfidenceEvaluation = {
    overallScore: authority.founderConfidenceScore,
    founderConfidenceResult: authority.founderConfidenceResult,
    confidence: authority.confidence,
    confidenceVerdict: CONFIDENCE_VERDICT[authority.founderConfidenceResult],
    scores,
    totalGaps: authority.gapAnalysis.gaps.length,
    criticalGaps: authority.gapAnalysis.criticalConfidenceGaps.length,
  };

  setCachedFounderConfidenceEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFounderConfidenceEvaluatorForTests(): void {
  evaluationCount = 0;
}
