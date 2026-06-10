/**
 * Founder Readiness Authority — report builder.
 */

import type {
  FounderReadinessAuthority,
  FounderReadinessEvaluation,
  FounderReadinessRecord,
  FounderReadinessReport,
} from './founder-readiness-types.js';
import { FOUNDER_READINESS_REPORTING_PASS } from './founder-readiness-types.js';
import { getFounderReadinessCacheStats } from './founder-readiness-cache.js';
import { getFounderReadinessHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateFounderReadinessReport(
  record: FounderReadinessRecord,
  evaluation: FounderReadinessEvaluation,
  authority: FounderReadinessAuthority,
): FounderReadinessReport {
  reportCount += 1;
  const cache = getFounderReadinessCacheStats();

  const recommendedPriorityFixes: string[] = [];
  for (const gap of authority.roadmap.criticalReadinessFixes.slice(0, 3)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  for (const blocker of authority.readinessBlockers.criticalReadinessBlockers.slice(0, 2)) {
    recommendedPriorityFixes.push(`${blocker.title}: ${blocker.description}`);
  }
  for (const gap of authority.roadmap.launchPreparation.slice(0, 2)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue monitoring founder readiness signals on product surface changes');
  }

  return {
    founderReadinessScore: record.overallScore,
    founderReadinessResult: record.founderReadinessResult,
    founderReadinessStatus: record.founderReadinessStatus,
    workflowReadinessScore: evaluation.scores.workflowReadinessScore,
    confidenceReadinessScore: evaluation.scores.confidenceReadinessScore,
    trustReadinessScore: evaluation.scores.trustReadinessScore,
    productivityReadinessScore: evaluation.scores.productivityReadinessScore,
    frictionReadinessScore: evaluation.scores.frictionReadinessScore,
    detectedReadinessGaps: authority.gapAnalysis.gaps,
    criticalReadinessGaps: authority.gapAnalysis.criticalReadinessGaps,
    majorReadinessGaps: authority.gapAnalysis.majorReadinessGaps,
    minorReadinessGaps: authority.gapAnalysis.minorReadinessGaps,
    readinessBlockers: authority.readinessBlockers.blockers,
    criticalReadinessBlockers: authority.readinessBlockers.criticalReadinessBlockers,
    founderReadinessRoadmap: authority.roadmap,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getFounderReadinessHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: FOUNDER_READINESS_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetFounderReadinessReportBuilderForTests(): void {
  reportCount = 0;
}
