/**
 * Product Experience Verification Engine — report builder.
 */

import type {
  ExperienceGapAnalysis,
  ProductExperienceEvaluation,
  ProductExperienceRecord,
  ProductExperienceReport,
  ProductExperienceRoadmap,
} from './product-experience-types.js';
import { PRODUCT_EXPERIENCE_REPORTING_PASS } from './product-experience-types.js';
import { getProductExperienceCacheStats } from './product-experience-cache.js';
import { getProductExperienceHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateProductExperienceReport(
  record: ProductExperienceRecord,
  evaluation: ProductExperienceEvaluation,
  gapAnalysis: ExperienceGapAnalysis,
  roadmap: ProductExperienceRoadmap,
): ProductExperienceReport {
  reportCount += 1;
  const cache = getProductExperienceCacheStats();

  const criticalExperienceRisks = gapAnalysis.criticalGaps.map((g) => `${g.title}: ${g.description}`);
  const founderRisks = gapAnalysis.gaps
    .filter((g) => g.detectionCode.startsWith('FOUNDER') || g.sourceVerifier === 'founder-experience-verifier')
    .map((g) => g.title);
  const trustRisks = gapAnalysis.gaps
    .filter((g) => g.detectionCode.startsWith('TRUST') || g.sourceVerifier === 'trust-continuity-verifier')
    .map((g) => g.title);
  const launchRisks = gapAnalysis.gaps
    .filter((g) => g.detectionCode.startsWith('LAUNCH') || g.detectionCode === 'READINESS_MISMATCH')
    .map((g) => g.title);

  const recommendedPriorityFixes: string[] = [];
  for (const gap of roadmap.criticalExperienceFixes.slice(0, 3)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  for (const gap of roadmap.highImpactImprovements.slice(0, 2)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue monitoring product experience on surface changes');
  }

  return {
    overallProductExperienceScore: record.overallScore,
    productCoherenceScore: evaluation.productCoherenceScore,
    experienceContinuityScore: evaluation.experienceContinuityScore,
    intelligenceContinuityScore: evaluation.intelligenceContinuityScore,
    workflowContinuityScore: evaluation.workflowContinuityScore,
    navigationContinuityScore: evaluation.navigationContinuityScore,
    verificationContinuityScore: evaluation.verificationContinuityScore,
    founderExperienceScore: evaluation.founderExperienceScore,
    trustContinuityScore: evaluation.trustContinuityScore,
    productIdentityScore: evaluation.productIdentityScore,
    launchReadinessScore: evaluation.launchReadinessScore,
    readinessLevel: evaluation.readinessLevel,
    productExperienceResult: record.productExperienceResult,
    detectedExperienceGaps: gapAnalysis.gaps,
    criticalExperienceRisks,
    founderRisks,
    trustRisks,
    launchRisks,
    productExperienceRoadmap: roadmap,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getProductExperienceHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: PRODUCT_EXPERIENCE_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetProductExperienceReportBuilderForTests(): void {
  reportCount = 0;
}
