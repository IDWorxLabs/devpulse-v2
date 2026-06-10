/**
 * Founder Friction Detector — evaluator.
 */

import type {
  FounderFrictionAuthority,
  FounderFrictionEvaluation,
  FounderFrictionResult,
  FounderFrictionScore,
} from './founder-friction-types.js';
import { getCachedFounderFrictionEvaluation, setCachedFounderFrictionEvaluation } from './founder-friction-cache.js';

let evaluationCount = 0;

const FRICTION_VERDICT: Record<FounderFrictionResult, string> = {
  PASS: 'Founder friction is low — workflows and surfaces support founder effectiveness',
  PASS_WITH_WARNINGS: 'Founder friction mostly manageable — address friction gaps to improve daily effectiveness',
  FAIL: 'Founder friction is critically high — blockers actively impede founder progress',
};

export function buildFounderFrictionScore(authority: FounderFrictionAuthority): FounderFrictionScore {
  return {
    overallScore: authority.founderFrictionScore,
    confusionFrictionScore: authority.confusionFriction.score,
    workflowFrictionScore: authority.workflowFriction.score,
    decisionFatigueScore: authority.decisionFatigue.score,
    contextSwitchingScore: authority.contextSwitching.score,
    discoverabilityScore: authority.discoverability.score,
    trustBreakdownScore: authority.trustBreakdowns.score,
    confidenceBreakdownScore: authority.confidenceBreakdowns.score,
    productivityFrictionScore: authority.productivityBlockers.score,
    verificationFrictionScore: authority.verificationFriction.score,
    launchFrictionScore: authority.launchFriction.score,
  };
}

export function evaluateFounderFriction(authority: FounderFrictionAuthority): FounderFrictionEvaluation {
  const cacheKey = [authority.authorityId, authority.founderFrictionScore, authority.founderFrictionResult].join('|');
  const cached = getCachedFounderFrictionEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;
  const scores = buildFounderFrictionScore(authority);

  const result: FounderFrictionEvaluation = {
    overallScore: authority.founderFrictionScore,
    founderFrictionResult: authority.founderFrictionResult,
    confidence: authority.confidence,
    frictionVerdict: FRICTION_VERDICT[authority.founderFrictionResult],
    scores,
    totalGaps: authority.gapAnalysis.gaps.length,
    criticalGaps: authority.gapAnalysis.criticalFrictionGaps.length,
  };

  setCachedFounderFrictionEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFounderFrictionEvaluatorForTests(): void {
  evaluationCount = 0;
}
