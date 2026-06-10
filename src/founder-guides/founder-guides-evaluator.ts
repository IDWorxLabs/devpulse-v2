/**
 * Founder Guides — evaluator.
 */

import type {
  FounderGuidesEvaluation,
  UnifiedFounderGuidesAuthority,
} from './founder-guides-types.js';
import {
  getCachedFounderGuidesEvaluation,
  setCachedFounderGuidesEvaluation,
} from './founder-guides-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<FounderGuidesEvaluation['state'], number> = {
  READY: 95,
  PARTIAL: 70,
  INCOMPLETE: 40,
  UNKNOWN: 10,
};

export function evaluateFounderGuides(
  authority: UnifiedFounderGuidesAuthority,
): FounderGuidesEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.founderCoverageScore,
    authority.state,
    authority.completenessLevel,
  ].join('|');

  const cached = getCachedFounderGuidesEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: FounderGuidesEvaluation = {
    founderCoverageScore: authority.founderCoverageScore,
    roadmapCoverageScore: authority.roadmapCoverageScore,
    checkpointCoverageScore: authority.checkpointCoverageScore,
    navigationCoverageScore: authority.navigationCoverageScore,
    safetyCoverageScore: authority.safetyCoverageScore,
    evolutionCoverageScore: authority.evolutionCoverageScore,
    completenessLevel: authority.completenessLevel,
    state: authority.state,
    confidence: authority.confidence,
    guideReadiness: Math.round((STATE_READINESS[authority.state] + authority.confidence) / 2),
  };

  setCachedFounderGuidesEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFounderGuidesEvaluatorForTests(): void {
  evaluationCount = 0;
}
