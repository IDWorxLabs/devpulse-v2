/**
 * Founder Productivity Validation — evaluator.
 */

import type {
  FounderProductivityAuthority,
  FounderProductivityEvaluation,
  FounderProductivityResult,
  FounderProductivityScore,
} from './founder-productivity-types.js';
import { getCachedFounderProductivityEvaluation, setCachedFounderProductivityEvaluation } from './founder-productivity-cache.js';

let evaluationCount = 0;

const PRODUCTIVITY_VERDICT: Record<FounderProductivityResult, string> = {
  PASS: 'DevPulse meaningfully improves founder productivity across workflows and delivery',
  PASS_WITH_WARNINGS: 'Founder productivity mostly supported — address productivity gaps for daily efficiency',
  FAIL: 'Founder productivity has critical gaps — manual work and overhead too high for founder daily use',
};

export function buildFounderProductivityScore(authority: FounderProductivityAuthority): FounderProductivityScore {
  return {
    overallScore: authority.founderProductivityScore,
    workflowAccelerationScore: authority.workflowAcceleration.score,
    manualWorkReductionScore: authority.manualWorkReduction.score,
    decisionReductionScore: authority.decisionReduction.score,
    contextSwitchingScore: authority.contextSwitching.score,
    executionEfficiencyScore: authority.executionEfficiency.score,
    throughputScore: authority.throughput.score,
    workflowOverheadScore: authority.workflowOverhead.score,
  };
}

export function evaluateFounderProductivity(authority: FounderProductivityAuthority): FounderProductivityEvaluation {
  const cacheKey = [authority.authorityId, authority.founderProductivityScore, authority.founderProductivityResult].join('|');
  const cached = getCachedFounderProductivityEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;
  const scores = buildFounderProductivityScore(authority);

  const result: FounderProductivityEvaluation = {
    overallScore: authority.founderProductivityScore,
    founderProductivityResult: authority.founderProductivityResult,
    confidence: authority.confidence,
    productivityVerdict: PRODUCTIVITY_VERDICT[authority.founderProductivityResult],
    scores,
    totalGaps: authority.gapAnalysis.gaps.length,
    criticalGaps: authority.gapAnalysis.criticalProductivityGaps.length,
  };

  setCachedFounderProductivityEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFounderProductivityEvaluatorForTests(): void {
  evaluationCount = 0;
}
