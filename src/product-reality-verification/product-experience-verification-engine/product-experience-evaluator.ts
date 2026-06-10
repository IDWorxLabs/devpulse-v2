/**
 * Product Experience Verification Engine — final evaluation.
 */

import type { ProductExperienceAuthority, ProductExperienceEvaluation } from './product-experience-types.js';
import { getCachedProductExperienceEvaluation, setCachedProductExperienceEvaluation } from './product-experience-cache.js';

let evaluationCount = 0;

const EXPERIENCE_VERDICT: Record<ProductExperienceEvaluation['productExperienceResult'], string> = {
  PASS: 'DevPulse behaves as one coherent product experience',
  PASS_WITH_WARNINGS: 'Product experience mostly coherent — address continuity gaps before external launch',
  FAIL: 'Product experience fragmented — critical continuity gaps prevent coherent product claim',
};

export function evaluateProductExperience(authority: ProductExperienceAuthority): ProductExperienceEvaluation {
  const cacheKey = [authority.authorityId, authority.overallScore, authority.productExperienceResult].join('|');
  const cached = getCachedProductExperienceEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: ProductExperienceEvaluation = {
    overallScore: authority.overallScore,
    productExperienceResult: authority.productExperienceResult,
    confidence: authority.confidence,
    experienceVerdict: EXPERIENCE_VERDICT[authority.productExperienceResult],
    productCoherenceScore: authority.productCoherenceScore,
    experienceContinuityScore: authority.experienceContinuityScore,
    intelligenceContinuityScore: authority.intelligenceContinuityScore,
    workflowContinuityScore: authority.workflowContinuityScore,
    navigationContinuityScore: authority.navigationContinuityScore,
    verificationContinuityScore: authority.verificationContinuityScore,
    founderExperienceScore: authority.founderExperienceScore,
    trustContinuityScore: authority.trustContinuityScore,
    productIdentityScore: authority.productIdentityScore,
    launchReadinessScore: authority.launchReadinessScore,
    readinessLevel: authority.readinessLevel,
    totalGaps: authority.totalGaps,
    criticalGaps: authority.criticalGaps,
  };

  setCachedProductExperienceEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetProductExperienceEvaluationForTests(): void {
  evaluationCount = 0;
}
