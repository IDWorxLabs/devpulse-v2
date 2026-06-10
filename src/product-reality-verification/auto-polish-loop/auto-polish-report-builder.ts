/**
 * Auto-Polish Loop — report builder.
 */

import type {
  AutoPolishEvaluation,
  AutoPolishRecord,
  AutoPolishReport,
  PolishPriorityAnalysis,
  PolishRoadmap,
} from './auto-polish-types.js';
import { AUTO_POLISH_REPORTING_PASS } from './auto-polish-types.js';
import { getAutoPolishCacheStats } from './auto-polish-cache.js';
import { getAutoPolishHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateAutoPolishReport(
  record: AutoPolishRecord,
  evaluation: AutoPolishEvaluation,
  priority: PolishPriorityAnalysis,
  roadmap: PolishRoadmap,
): AutoPolishReport {
  reportCount += 1;
  const cache = getAutoPolishCacheStats();

  const recommendedNextImprovements: string[] = [];
  for (const opp of roadmap.criticalBeforeLaunch.slice(0, 3)) {
    recommendedNextImprovements.push(`${opp.title}: ${opp.description}`);
  }
  for (const opp of roadmap.highImpactImprovements.slice(0, 2)) {
    recommendedNextImprovements.push(`${opp.title}: ${opp.description}`);
  }
  if (recommendedNextImprovements.length === 0) {
    recommendedNextImprovements.push('Continue monitoring polish on product surface changes');
  }

  return {
    overallScore: record.overallScore,
    visualPolishScore: evaluation.visualPolishScore,
    uxPolishScore: evaluation.uxPolishScore,
    responsivePolishScore: evaluation.responsivePolishScore,
    previewPolishScore: evaluation.previewPolishScore,
    discoverabilityScore: evaluation.discoverabilityScore,
    founderUsabilityScore: evaluation.founderUsabilityScore,
    trustScore: evaluation.trustScore,
    intelligenceVisibilityScore: evaluation.intelligenceVisibilityScore,
    workflowScore: evaluation.workflowScore,
    productCoherenceScore: evaluation.productCoherenceScore,
    autoPolishResult: record.autoPolishResult,
    totalOpportunities: evaluation.totalOpportunities,
    criticalOpportunities: evaluation.criticalOpportunities,
    priority1Opportunities: priority.priority1,
    priority2Opportunities: priority.priority2,
    priority3Opportunities: priority.priority3,
    priority4Opportunities: priority.priority4,
    launchBlockers: priority.launchBlockers,
    polishRoadmap: roadmap,
    recommendedNextImprovements: [...new Set(recommendedNextImprovements)],
    evaluation,
    historySize: getAutoPolishHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: AUTO_POLISH_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetAutoPolishReportBuilderForTests(): void {
  reportCount = 0;
}
