/**
 * Founder Friction Detector — report builder.
 */

import type {
  FounderFrictionAuthority,
  FounderFrictionEvaluation,
  FounderFrictionRecord,
  FounderFrictionReport,
} from './founder-friction-types.js';
import { FOUNDER_FRICTION_REPORTING_PASS } from './founder-friction-types.js';
import { getFounderFrictionCacheStats } from './founder-friction-cache.js';
import { getFounderFrictionHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateFounderFrictionReport(
  record: FounderFrictionRecord,
  evaluation: FounderFrictionEvaluation,
  authority: FounderFrictionAuthority,
): FounderFrictionReport {
  reportCount += 1;
  const cache = getFounderFrictionCacheStats();

  const recommendedPriorityFixes: string[] = [];
  for (const gap of authority.roadmap.criticalFrictionRemoval.slice(0, 3)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  for (const gap of authority.roadmap.highPriorityImprovements.slice(0, 2)) {
    recommendedPriorityFixes.push(`${gap.title}: ${gap.description}`);
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue monitoring founder friction signals on product surface changes');
  }

  return {
    founderFrictionScore: record.overallScore,
    founderFrictionResult: record.founderFrictionResult,
    confusionFrictionScore: evaluation.scores.confusionFrictionScore,
    workflowFrictionScore: evaluation.scores.workflowFrictionScore,
    decisionFatigueScore: evaluation.scores.decisionFatigueScore,
    contextSwitchingScore: evaluation.scores.contextSwitchingScore,
    discoverabilityScore: evaluation.scores.discoverabilityScore,
    trustBreakdownScore: evaluation.scores.trustBreakdownScore,
    confidenceBreakdownScore: evaluation.scores.confidenceBreakdownScore,
    productivityFrictionScore: evaluation.scores.productivityFrictionScore,
    verificationFrictionScore: evaluation.scores.verificationFrictionScore,
    launchFrictionScore: evaluation.scores.launchFrictionScore,
    detectedFrictionGaps: authority.gapAnalysis.gaps,
    criticalFrictionGaps: authority.gapAnalysis.criticalFrictionGaps,
    majorFrictionGaps: authority.gapAnalysis.majorFrictionGaps,
    minorFrictionGaps: authority.gapAnalysis.minorFrictionGaps,
    founderFrictionRoadmap: authority.roadmap,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getFounderFrictionHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: FOUNDER_FRICTION_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetFounderFrictionReportBuilderForTests(): void {
  reportCount = 0;
}
