/**
 * Founder Trust Validation — evaluator.
 */

import type {
  FounderTrustAuthority,
  FounderTrustEvaluation,
  FounderTrustResult,
  FounderTrustScore,
} from './founder-trust-types.js';
import { getCachedFounderTrustEvaluation, setCachedFounderTrustEvaluation } from './founder-trust-cache.js';

let evaluationCount = 0;

const TRUST_VERDICT: Record<FounderTrustResult, string> = {
  PASS: 'DevPulse earns founder trust through truthfulness, transparency, and safety boundaries',
  PASS_WITH_WARNINGS: 'Founder trust mostly supported — address trust gaps before daily reliance',
  FAIL: 'Founder trust has critical gaps — system claims and boundaries not trustworthy',
};

export function buildFounderTrustScore(authority: FounderTrustAuthority): FounderTrustScore {
  return {
    overallScore: authority.founderTrustScore,
    truthfulnessScore: authority.truthfulness.score,
    transparencyScore: authority.transparency.score,
    verificationIntegrityScore: authority.verificationIntegrity.score,
    governanceComplianceScore: authority.governanceCompliance.score,
    executionPredictabilityScore: authority.executionPredictability.score,
    evidenceVisibilityScore: authority.evidenceVisibility.score,
    rollbackConfidenceScore: authority.rollbackConfidence.score,
    safetyBoundariesScore: authority.safetyBoundaries.score,
  };
}

export function evaluateFounderTrust(authority: FounderTrustAuthority): FounderTrustEvaluation {
  const cacheKey = [authority.authorityId, authority.founderTrustScore, authority.founderTrustResult].join('|');
  const cached = getCachedFounderTrustEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;
  const scores = buildFounderTrustScore(authority);

  const result: FounderTrustEvaluation = {
    overallScore: authority.founderTrustScore,
    founderTrustResult: authority.founderTrustResult,
    confidence: authority.confidence,
    trustVerdict: TRUST_VERDICT[authority.founderTrustResult],
    scores,
    totalGaps: authority.gapAnalysis.gaps.length,
    criticalGaps: authority.gapAnalysis.criticalTrustGaps.length,
  };

  setCachedFounderTrustEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFounderTrustEvaluatorForTests(): void {
  evaluationCount = 0;
}
