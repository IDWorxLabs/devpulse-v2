/**
 * User Guides — evaluator.
 */

import type {
  UnifiedUserGuidesAuthority,
  UserGuidesEvaluation,
} from './user-guides-types.js';
import {
  getCachedUserGuidesEvaluation,
  setCachedUserGuidesEvaluation,
} from './user-guides-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<UserGuidesEvaluation['state'], number> = {
  READY: 95,
  PARTIAL: 70,
  INCOMPLETE: 40,
  UNKNOWN: 10,
};

export function evaluateUserGuides(
  authority: UnifiedUserGuidesAuthority,
): UserGuidesEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.userCoverageScore,
    authority.state,
    authority.completenessLevel,
  ].join('|');

  const cached = getCachedUserGuidesEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: UserGuidesEvaluation = {
    userCoverageScore: authority.userCoverageScore,
    onboardingCoverageScore: authority.onboardingCoverageScore,
    workflowCoverageScore: authority.workflowCoverageScore,
    featureCoverageScore: authority.featureCoverageScore,
    safetyCoverageScore: authority.safetyCoverageScore,
    interpretationCoverageScore: authority.interpretationCoverageScore,
    completenessLevel: authority.completenessLevel,
    state: authority.state,
    confidence: authority.confidence,
    guideReadiness: Math.round((STATE_READINESS[authority.state] + authority.confidence) / 2),
  };

  setCachedUserGuidesEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetUserGuidesEvaluatorForTests(): void {
  evaluationCount = 0;
}
