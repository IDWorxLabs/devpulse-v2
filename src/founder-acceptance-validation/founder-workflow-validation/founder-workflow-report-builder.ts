/**
 * Founder Workflow Validation — report builder.
 */

import type {
  FounderWorkflowAuthority,
  FounderWorkflowEvaluation,
  FounderWorkflowRecord,
  FounderWorkflowReport,
} from './founder-workflow-types.js';
import { FOUNDER_WORKFLOW_REPORTING_PASS } from './founder-workflow-types.js';
import { getFounderWorkflowCacheStats } from './founder-workflow-cache.js';
import { getFounderWorkflowHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateFounderWorkflowReport(
  record: FounderWorkflowRecord,
  evaluation: FounderWorkflowEvaluation,
  authority: FounderWorkflowAuthority,
): FounderWorkflowReport {
  reportCount += 1;
  const cache = getFounderWorkflowCacheStats();

  const recommendedPriorityFixes: string[] = [];
  for (const gap of authority.roadmap.criticalWorkflowFixes.slice(0, 3)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  for (const gap of authority.roadmap.highPriorityImprovements.slice(0, 2)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue monitoring founder workflows on product surface changes');
  }

  return {
    founderWorkflowScore: record.overallScore,
    founderWorkflowResult: record.founderWorkflowResult,
    clarityScore: evaluation.scores.clarityScore,
    discoverabilityScore: evaluation.scores.discoverabilityScore,
    continuityScore: evaluation.scores.continuityScore,
    frictionScore: evaluation.scores.frictionScore,
    recoveryScore: evaluation.scores.recoveryScore,
    outcomeScore: evaluation.scores.outcomeScore,
    efficiencyScore: evaluation.scores.efficiencyScore,
    detectedWorkflowGaps: authority.gapAnalysis.gaps,
    criticalWorkflowGaps: authority.gapAnalysis.criticalWorkflowGaps,
    majorWorkflowGaps: authority.gapAnalysis.majorWorkflowGaps,
    minorWorkflowGaps: authority.gapAnalysis.minorWorkflowGaps,
    founderWorkflowRoadmap: authority.roadmap,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getFounderWorkflowHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: FOUNDER_WORKFLOW_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetFounderWorkflowReportBuilderForTests(): void {
  reportCount = 0;
}
