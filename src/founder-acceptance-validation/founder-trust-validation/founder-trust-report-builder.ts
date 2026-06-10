/**
 * Founder Trust Validation — report builder.
 */

import type {
  FounderTrustAuthority,
  FounderTrustEvaluation,
  FounderTrustRecord,
  FounderTrustReport,
} from './founder-trust-types.js';
import { FOUNDER_TRUST_REPORTING_PASS } from './founder-trust-types.js';
import { getFounderTrustCacheStats } from './founder-trust-cache.js';
import { getFounderTrustHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateFounderTrustReport(
  record: FounderTrustRecord,
  evaluation: FounderTrustEvaluation,
  authority: FounderTrustAuthority,
): FounderTrustReport {
  reportCount += 1;
  const cache = getFounderTrustCacheStats();

  const recommendedPriorityFixes: string[] = [];
  for (const gap of authority.roadmap.criticalTrustFixes.slice(0, 3)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  for (const gap of authority.roadmap.highPriorityTrustImprovements.slice(0, 2)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue monitoring founder trust signals on product surface changes');
  }

  return {
    founderTrustScore: record.overallScore,
    founderTrustResult: record.founderTrustResult,
    truthfulnessScore: evaluation.scores.truthfulnessScore,
    transparencyScore: evaluation.scores.transparencyScore,
    verificationIntegrityScore: evaluation.scores.verificationIntegrityScore,
    governanceComplianceScore: evaluation.scores.governanceComplianceScore,
    executionPredictabilityScore: evaluation.scores.executionPredictabilityScore,
    evidenceVisibilityScore: evaluation.scores.evidenceVisibilityScore,
    rollbackConfidenceScore: evaluation.scores.rollbackConfidenceScore,
    safetyBoundariesScore: evaluation.scores.safetyBoundariesScore,
    detectedTrustGaps: authority.gapAnalysis.gaps,
    criticalTrustGaps: authority.gapAnalysis.criticalTrustGaps,
    majorTrustGaps: authority.gapAnalysis.majorTrustGaps,
    minorTrustGaps: authority.gapAnalysis.minorTrustGaps,
    founderTrustRoadmap: authority.roadmap,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getFounderTrustHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: FOUNDER_TRUST_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetFounderTrustReportBuilderForTests(): void {
  reportCount = 0;
}
