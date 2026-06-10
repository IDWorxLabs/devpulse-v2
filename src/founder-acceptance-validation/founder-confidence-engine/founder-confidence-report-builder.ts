/**
 * Founder Confidence Engine — report builder.
 */

import type {
  FounderConfidenceAuthority,
  FounderConfidenceEvaluation,
  FounderConfidenceRecord,
  FounderConfidenceReport,
} from './founder-confidence-types.js';
import { FOUNDER_CONFIDENCE_REPORTING_PASS } from './founder-confidence-types.js';
import { getFounderConfidenceCacheStats } from './founder-confidence-cache.js';
import { getFounderConfidenceHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateFounderConfidenceReport(
  record: FounderConfidenceRecord,
  evaluation: FounderConfidenceEvaluation,
  authority: FounderConfidenceAuthority,
): FounderConfidenceReport {
  reportCount += 1;
  const cache = getFounderConfidenceCacheStats();

  const recommendedPriorityFixes: string[] = [];
  for (const gap of authority.roadmap.criticalConfidenceFixes.slice(0, 3)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  for (const gap of authority.roadmap.highPriorityImprovements.slice(0, 2)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue monitoring founder confidence signals on product surface changes');
  }

  return {
    founderConfidenceScore: record.overallScore,
    founderConfidenceResult: record.founderConfidenceResult,
    understandingConfidenceScore: evaluation.scores.understandingConfidenceScore,
    reasoningVisibilityScore: evaluation.scores.reasoningVisibilityScore,
    progressTruthScore: evaluation.scores.progressTruthScore,
    nextStepConfidenceScore: evaluation.scores.nextStepConfidenceScore,
    decisionConfidenceScore: evaluation.scores.decisionConfidenceScore,
    uncertaintyHonestyScore: evaluation.scores.uncertaintyHonestyScore,
    founderControlConfidenceScore: evaluation.scores.founderControlConfidenceScore,
    detectedConfidenceGaps: authority.gapAnalysis.gaps,
    criticalConfidenceGaps: authority.gapAnalysis.criticalConfidenceGaps,
    majorConfidenceGaps: authority.gapAnalysis.majorConfidenceGaps,
    minorConfidenceGaps: authority.gapAnalysis.minorConfidenceGaps,
    founderConfidenceRoadmap: authority.roadmap,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getFounderConfidenceHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: FOUNDER_CONFIDENCE_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetFounderConfidenceReportBuilderForTests(): void {
  reportCount = 0;
}
