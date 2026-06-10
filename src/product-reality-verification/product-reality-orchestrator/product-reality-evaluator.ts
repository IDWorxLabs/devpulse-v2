/**
 * Product Reality Orchestrator — final evaluator.
 */

import type {
  ProductRealityAuthority,
  ProductRealityEvaluation,
  ProductRealityResult,
  ProductRealityScore,
} from './product-reality-types.js';
import {
  PRODUCT_REALITY_SCORING_PASS,
  PRODUCT_REALITY_VERDICT_PASS,
} from './product-reality-types.js';
import {
  getCachedProductRealityEvaluation,
  setCachedProductRealityEvaluation,
  getCachedProductRealityScore,
  setCachedProductRealityScore,
} from './product-reality-cache.js';

let evaluationCount = 0;

const REALITY_VERDICT: Record<ProductRealityEvaluation['productRealityVerdict'], string> = {
  PRODUCT_NOT_READY: 'Product is not genuinely coherent, polished, or launch-ready',
  PRODUCT_PARTIALLY_READY: 'Product shows meaningful progress but critical continuity gaps remain',
  PRODUCT_READY: 'Product is coherent, trustworthy, and aligned with intended DevPulse experience',
  PRODUCT_LAUNCH_READY: 'Product is launch-ready — coherent, polished, trustworthy, and verification-aligned',
};

export function buildProductRealityScore(authority: ProductRealityAuthority): ProductRealityScore {
  const cacheKey = [authority.authorityId, authority.aggregate.overallExperienceScore].join('|');
  const cached = getCachedProductRealityScore(cacheKey);
  if (cached) return cached;

  const result: ProductRealityScore = {
    overallScore: authority.aggregate.overallExperienceScore,
    dimensionScores: authority.aggregate,
    passToken: PRODUCT_REALITY_SCORING_PASS,
  };
  setCachedProductRealityScore(cacheKey, result);
  return result;
}

export function buildProductRealityResult(authority: ProductRealityAuthority): ProductRealityResult {
  const criticalConflicts = authority.conflicts.filter(
    (c) => c.conflictSeverity === 'CRITICAL' || c.conflictSeverity === 'HIGH',
  ).length;

  return {
    productRealityVerdict: authority.overallVerdict,
    releaseReadiness: authority.releaseReadiness,
    overallScore: authority.aggregate.overallExperienceScore,
    confidence: authority.confidence,
    criticalBlockerCount: authority.blockers.filter((b) => b.blockerSeverity === 'CRITICAL').length,
    conflictCount: criticalConflicts,
    passToken: PRODUCT_REALITY_VERDICT_PASS,
  };
}

export function evaluateProductReality(authority: ProductRealityAuthority): ProductRealityEvaluation {
  const cacheKey = [authority.authorityId, authority.overallVerdict, authority.releaseReadiness].join('|');
  const cached = getCachedProductRealityEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;
  const criticalConflicts = authority.conflicts.filter(
    (c) => c.conflictSeverity === 'CRITICAL' || c.conflictSeverity === 'HIGH',
  ).length;

  const result: ProductRealityEvaluation = {
    overallScore: authority.aggregate.overallExperienceScore,
    productRealityVerdict: authority.overallVerdict,
    releaseReadiness: authority.releaseReadiness,
    confidence: authority.confidence,
    realityVerdict: REALITY_VERDICT[authority.overallVerdict],
    aggregate: authority.aggregate,
    criticalBlockerCount: authority.blockers.filter((b) => b.blockerSeverity === 'CRITICAL').length,
    conflictCount: criticalConflicts,
  };

  setCachedProductRealityEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetProductRealityEvaluationForTests(): void {
  evaluationCount = 0;
}
