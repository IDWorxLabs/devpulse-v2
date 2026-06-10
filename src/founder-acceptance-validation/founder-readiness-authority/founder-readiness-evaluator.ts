/**
 * Founder Readiness Authority — evaluator.
 */

import type {
  FounderReadinessAuthority,
  FounderReadinessEvaluation,
  FounderReadinessResult,
  FounderReadinessScore,
  FounderReadinessStatus,
} from './founder-readiness-types.js';
import { getCachedFounderReadinessEvaluation, setCachedFounderReadinessEvaluation } from './founder-readiness-cache.js';

let evaluationCount = 0;

const READINESS_VERDICT: Record<FounderReadinessResult, string> = {
  PASS: 'Founder is ready to operate DevPulse effectively today',
  PASS_WITH_WARNINGS: 'Founder is partially ready — address readiness gaps before full daily operation',
  FAIL: 'Founder is not ready — critical blockers prevent effective DevPulse operation',
};

const STATUS_VERDICT: Record<FounderReadinessStatus, string> = {
  FOUNDER_NOT_READY: 'Founder cannot operate DevPulse effectively today',
  FOUNDER_PARTIALLY_READY: 'Founder can operate with caution — readiness gaps remain',
  FOUNDER_READY: 'Founder is ready for effective daily DevPulse operation',
  FOUNDER_LAUNCH_READY: 'Founder is ready for launch-level DevPulse adoption',
};

export function buildFounderReadinessScore(authority: FounderReadinessAuthority): FounderReadinessScore {
  return {
    overallScore: authority.founderReadinessScore,
    workflowReadinessScore: authority.workflowReadiness.score,
    confidenceReadinessScore: authority.confidenceReadiness.score,
    trustReadinessScore: authority.trustReadiness.score,
    productivityReadinessScore: authority.productivityReadiness.score,
    frictionReadinessScore: authority.frictionReadiness.score,
  };
}

export function evaluateFounderReadiness(authority: FounderReadinessAuthority): FounderReadinessEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.founderReadinessScore,
    authority.founderReadinessResult,
    authority.founderReadinessStatus,
  ].join('|');
  const cached = getCachedFounderReadinessEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;
  const scores = buildFounderReadinessScore(authority);

  const result: FounderReadinessEvaluation = {
    overallScore: authority.founderReadinessScore,
    founderReadinessResult: authority.founderReadinessResult,
    founderReadinessStatus: authority.founderReadinessStatus,
    confidence: authority.confidence,
    readinessVerdict: `${READINESS_VERDICT[authority.founderReadinessResult]} — ${STATUS_VERDICT[authority.founderReadinessStatus]}`,
    scores,
    totalGaps: authority.gapAnalysis.gaps.length,
    criticalGaps: authority.gapAnalysis.criticalReadinessGaps.length,
    criticalBlockers: authority.readinessBlockers.criticalReadinessBlockers.length,
  };

  setCachedFounderReadinessEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFounderReadinessEvaluatorForTests(): void {
  evaluationCount = 0;
}
