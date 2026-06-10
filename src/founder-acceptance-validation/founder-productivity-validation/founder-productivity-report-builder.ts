/**
 * Founder Productivity Validation — report builder.
 */

import type {
  FounderProductivityAuthority,
  FounderProductivityEvaluation,
  FounderProductivityRecord,
  FounderProductivityReport,
} from './founder-productivity-types.js';
import { FOUNDER_PRODUCTIVITY_REPORTING_PASS } from './founder-productivity-types.js';
import { getFounderProductivityCacheStats } from './founder-productivity-cache.js';
import { getFounderProductivityHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateFounderProductivityReport(
  record: FounderProductivityRecord,
  evaluation: FounderProductivityEvaluation,
  authority: FounderProductivityAuthority,
): FounderProductivityReport {
  reportCount += 1;
  const cache = getFounderProductivityCacheStats();

  const recommendedPriorityFixes: string[] = [];
  for (const gap of authority.roadmap.criticalProductivityFixes.slice(0, 3)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  for (const gap of authority.roadmap.highPriorityProductivityImprovements.slice(0, 2)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue monitoring founder productivity signals on product surface changes');
  }

  return {
    founderProductivityScore: record.overallScore,
    founderProductivityResult: record.founderProductivityResult,
    workflowAccelerationScore: evaluation.scores.workflowAccelerationScore,
    manualWorkReductionScore: evaluation.scores.manualWorkReductionScore,
    decisionReductionScore: evaluation.scores.decisionReductionScore,
    contextSwitchingScore: evaluation.scores.contextSwitchingScore,
    executionEfficiencyScore: evaluation.scores.executionEfficiencyScore,
    throughputScore: evaluation.scores.throughputScore,
    workflowOverheadScore: evaluation.scores.workflowOverheadScore,
    detectedProductivityGaps: authority.gapAnalysis.gaps,
    criticalProductivityGaps: authority.gapAnalysis.criticalProductivityGaps,
    majorProductivityGaps: authority.gapAnalysis.majorProductivityGaps,
    minorProductivityGaps: authority.gapAnalysis.minorProductivityGaps,
    founderProductivityRoadmap: authority.roadmap,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getFounderProductivityHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: FOUNDER_PRODUCTIVITY_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetFounderProductivityReportBuilderForTests(): void {
  reportCount = 0;
}
