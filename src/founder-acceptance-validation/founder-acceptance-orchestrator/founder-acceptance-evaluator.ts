/**
 * Founder Acceptance Orchestrator — evaluator.
 */

import type {
  FounderAcceptanceAuthority,
  FounderAcceptanceEvaluation,
  FounderAcceptanceResult,
  FounderAcceptanceScore,
  FounderAcceptanceVerdict,
} from './founder-acceptance-orchestrator-types.js';
import { getCachedFounderAcceptanceEvaluation, setCachedFounderAcceptanceEvaluation } from './founder-acceptance-cache.js';

let evaluationCount = 0;

const ACCEPTANCE_VERDICT: Record<FounderAcceptanceResult, string> = {
  PASS: 'Founder would genuinely accept DevPulse in its current state',
  PASS_WITH_WARNINGS: 'Founder would partially accept DevPulse — address acceptance gaps first',
  FAIL: 'Founder would not accept DevPulse — critical blockers prevent genuine acceptance',
};

export function buildFounderAcceptanceScore(authority: FounderAcceptanceAuthority): FounderAcceptanceScore {
  return {
    overallScore: authority.founderAcceptanceScore,
    workflowScore: authority.aggregate.workflowScore,
    confidenceScore: authority.aggregate.confidenceScore,
    trustScore: authority.aggregate.trustScore,
    productivityScore: authority.aggregate.productivityScore,
    frictionScore: authority.aggregate.frictionScore,
    readinessScore: authority.aggregate.readinessScore,
  };
}

export function evaluateFounderAcceptance(authority: FounderAcceptanceAuthority): FounderAcceptanceEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.founderAcceptanceScore,
    authority.founderAcceptanceResult,
    authority.finalVerdict.verdict,
  ].join('|');
  const cached = getCachedFounderAcceptanceEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;
  const scores = buildFounderAcceptanceScore(authority);

  const result: FounderAcceptanceEvaluation = {
    overallScore: authority.founderAcceptanceScore,
    founderAcceptanceResult: authority.founderAcceptanceResult,
    founderAcceptanceVerdict: authority.finalVerdict.verdict,
    confidence: authority.confidence,
    acceptanceVerdict: `${ACCEPTANCE_VERDICT[authority.founderAcceptanceResult]} — ${authority.finalVerdict.verdictReason}`,
    scores,
    totalGaps: authority.gapAnalysis.gaps.length,
    criticalGaps: authority.gapAnalysis.criticalAcceptanceGaps.length,
    criticalBlockers: authority.blockers.criticalAcceptanceBlockers.length,
    conflictCount: authority.conflicts.conflicts.length,
  };

  setCachedFounderAcceptanceEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFounderAcceptanceEvaluatorForTests(): void {
  evaluationCount = 0;
}
