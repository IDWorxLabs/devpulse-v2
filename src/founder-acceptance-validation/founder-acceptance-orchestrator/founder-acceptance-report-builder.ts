/**
 * Founder Acceptance Orchestrator — report builder.
 */

import type {
  FounderAcceptanceAuthority,
  FounderAcceptanceEvaluation,
  FounderAcceptanceRecord,
  FounderAcceptanceReport,
} from './founder-acceptance-orchestrator-types.js';
import { FOUNDER_ACCEPTANCE_REPORTING_PASS } from './founder-acceptance-orchestrator-types.js';
import { getFounderAcceptanceCacheStats } from './founder-acceptance-cache.js';
import { getFounderAcceptanceHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateFounderAcceptanceReport(
  record: FounderAcceptanceRecord,
  evaluation: FounderAcceptanceEvaluation,
  authority: FounderAcceptanceAuthority,
): FounderAcceptanceReport {
  reportCount += 1;
  const cache = getFounderAcceptanceCacheStats();

  const recommendedPriorityFixes: string[] = [];
  for (const gap of authority.roadmap.criticalAcceptanceFixes.slice(0, 3)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  for (const blocker of authority.blockers.criticalAcceptanceBlockers.slice(0, 2)) {
    recommendedPriorityFixes.push(`${blocker.title}: ${blocker.description}`);
  }
  for (const conflict of authority.conflicts.conflicts.slice(0, 2)) {
    recommendedPriorityFixes.push(`${conflict.conflictCode}: ${conflict.conflictReason}`);
  }
  for (const gap of authority.roadmap.launchAcceptanceTasks.slice(0, 2)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Founder acceptance signals are healthy — continue monitoring on surface changes');
  }

  return {
    founderAcceptanceScore: record.overallScore,
    founderAcceptanceResult: record.founderAcceptanceResult,
    founderAcceptanceVerdict: record.founderAcceptanceVerdict,
    workflowScore: evaluation.scores.workflowScore,
    confidenceScore: evaluation.scores.confidenceScore,
    trustScore: evaluation.scores.trustScore,
    productivityScore: evaluation.scores.productivityScore,
    frictionScore: evaluation.scores.frictionScore,
    readinessScore: evaluation.scores.readinessScore,
    detectedAcceptanceGaps: authority.gapAnalysis.gaps,
    criticalAcceptanceGaps: authority.gapAnalysis.criticalAcceptanceGaps,
    majorAcceptanceGaps: authority.gapAnalysis.majorAcceptanceGaps,
    minorAcceptanceGaps: authority.gapAnalysis.minorAcceptanceGaps,
    acceptanceBlockers: authority.blockers.blockers,
    criticalAcceptanceBlockers: authority.blockers.criticalAcceptanceBlockers,
    authorityConflicts: authority.conflicts.conflicts,
    founderAcceptanceRoadmap: authority.roadmap,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getFounderAcceptanceHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: FOUNDER_ACCEPTANCE_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetFounderAcceptanceReportBuilderForTests(): void {
  reportCount = 0;
}
