/**
 * Launch Council Score Builder — deterministic council score aggregation.
 */

import type {
  LaunchCouncilAuthorityResult,
  LaunchCouncilReadinessState,
} from './launch-council-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return clamp(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function calculateLaunchCouncilOverallScore(
  authorityResults: LaunchCouncilAuthorityResult[],
): number {
  const participating = authorityResults.filter((result) => result.status !== 'NOT_RUN');
  return average(participating.map((result) => result.score));
}

export function calculateLaunchCouncilConfidenceScore(
  authorityResults: LaunchCouncilAuthorityResult[],
): number {
  const participating = authorityResults.filter((result) => result.status !== 'NOT_RUN');
  return average(participating.map((result) => result.confidence));
}

export function countLaunchCouncilBlockers(authorityResults: LaunchCouncilAuthorityResult[]): number {
  return authorityResults.filter((result) => result.launchBlocker).length;
}

export function deriveLaunchCouncilReadinessState(
  authorityResults: LaunchCouncilAuthorityResult[],
): LaunchCouncilReadinessState {
  if (
    authorityResults.length === 0 ||
    authorityResults.every((result) => result.status === 'NOT_RUN')
  ) {
    return 'UNKNOWN';
  }
  if (authorityResults.some((result) => result.launchBlocker)) {
    return 'BLOCKED';
  }
  if (authorityResults.some((result) => result.status === 'WARNING' || result.status === 'FAIL')) {
    return 'CAUTION';
  }
  return 'READY';
}

export function buildLaunchCouncilCacheKey(authorityResults: LaunchCouncilAuthorityResult[]): string {
  const digest = authorityResults
    .map(
      (result) =>
        `${result.authorityId}:${result.status}:${result.score}:${result.confidence}:${result.launchBlocker ? 1 : 0}`,
    )
    .join('|');
  return digest;
}
