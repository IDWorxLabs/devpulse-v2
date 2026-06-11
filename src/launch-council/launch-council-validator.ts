/**
 * Launch Council Validator — bounded integrity checks for council foundation.
 */

import { LAUNCH_COUNCIL_CACHE_KEY_PREFIX } from './launch-council-bounds.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
  validateLaunchCouncilAuthorityIds,
} from './launch-council-registry.js';
import {
  buildLaunchCouncilCacheKey,
  calculateLaunchCouncilConfidenceScore,
  calculateLaunchCouncilOverallScore,
  countLaunchCouncilBlockers,
  deriveLaunchCouncilReadinessState,
} from './launch-council-score-builder.js';
import type { LaunchCouncilAuthorityResult } from './launch-council-types.js';

export function validateLaunchCouncilRegistry(): { passed: boolean; detail: string } {
  const authorities = listLaunchCouncilAuthorities();
  const ids = authorities.map((entry) => entry.authorityId);
  const validation = validateLaunchCouncilAuthorityIds(ids);
  const integrity = assertLaunchCouncilRegistryIntegrity();
  const passed = integrity && validation.valid && authorities.length === 22;
  return {
    passed,
    detail: passed
      ? `registered=${authorities.length}`
      : `integrity=${integrity}; valid=${validation.valid}`,
  };
}

export function validateLaunchCouncilDeterministicScoring(
  sampleResults: LaunchCouncilAuthorityResult[],
): { passed: boolean; detail: string } {
  const firstOverall = calculateLaunchCouncilOverallScore(sampleResults);
  const secondOverall = calculateLaunchCouncilOverallScore(sampleResults);
  const firstConfidence = calculateLaunchCouncilConfidenceScore(sampleResults);
  const secondConfidence = calculateLaunchCouncilConfidenceScore(sampleResults);
  const firstState = deriveLaunchCouncilReadinessState(sampleResults);
  const secondState = deriveLaunchCouncilReadinessState(sampleResults);
  const cacheKey = `${LAUNCH_COUNCIL_CACHE_KEY_PREFIX}:${buildLaunchCouncilCacheKey(sampleResults)}`;
  const passed =
    firstOverall === secondOverall &&
    firstConfidence === secondConfidence &&
    firstState === secondState &&
    cacheKey.startsWith(`${LAUNCH_COUNCIL_CACHE_KEY_PREFIX}:`);
  return {
    passed,
    detail: `overall=${firstOverall}; confidence=${firstConfidence}; state=${firstState}; cache=${cacheKey}`,
  };
}

export function validateLaunchCouncilBlockerAggregation(
  blockedSample: LaunchCouncilAuthorityResult[],
): { passed: boolean; detail: string } {
  const blockerCount = countLaunchCouncilBlockers(blockedSample);
  const readinessState = deriveLaunchCouncilReadinessState(blockedSample);
  const passed = blockerCount > 0 && readinessState === 'BLOCKED';
  return {
    passed,
    detail: `blockers=${blockerCount}; state=${readinessState}`,
  };
}
