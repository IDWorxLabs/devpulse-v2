/**
 * UX Heuristic Evaluator — system status visibility analyzer.
 */

import type { SystemStatusVisibilityAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { SYSTEM_STATUS_VISIBILITY_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedSystemStatusVisibility, setCachedSystemStatusVisibility } from './ux-heuristic-cache.js';

export interface SystemStatusVisibilitySnapshot {
  statusBarPresent: boolean;
  statusItemsPresent: boolean;
  operatorFeedStagesPresent: boolean;
}

let statusVisibilityAnalysisCount = 0;

export function analyzeSystemStatusVisibility(
  input: UXHeuristicInput,
  snapshot: SystemStatusVisibilitySnapshot,
): SystemStatusVisibilityAnalysis {
  const cacheKey = [
    input.statusHidden,
    input.statusMisleading,
    input.readinessConfusion,
    snapshot.statusBarPresent,
  ].join('|');

  const cached = getCachedSystemStatusVisibility(cacheKey);
  if (cached) return cached;

  statusVisibilityAnalysisCount += 1;
  const statusProblems: string[] = [];
  let penalty = 0;

  const statusHidden = input.statusHidden === true;
  const statusMisleading = input.statusMisleading === true;
  const readinessConfusion = input.readinessConfusion === true;

  if (statusHidden) { statusProblems.push('STATUS_HIDDEN'); penalty += 20; }
  if (statusMisleading) { statusProblems.push('STATUS_MISLEADING'); penalty += 18; }
  if (readinessConfusion) { statusProblems.push('READINESS_CONFUSION'); penalty += 16; }

  const statusBonus =
    (snapshot.statusBarPresent ? 14 : 0)
    + (snapshot.statusItemsPresent ? 12 : 0)
    + (snapshot.operatorFeedStagesPresent ? 10 : 0);

  const systemStatusVisibilityScore = clampScore(84 + statusBonus - penalty);

  const result: SystemStatusVisibilityAnalysis = {
    systemStatusVisibilityScore,
    statusHidden,
    statusMisleading,
    readinessConfusion,
    statusProblems,
    passToken: SYSTEM_STATUS_VISIBILITY_PASS,
  };

  setCachedSystemStatusVisibility(cacheKey, result);
  return result;
}

export function getStatusVisibilityAnalysisCount(): number {
  return statusVisibilityAnalysisCount;
}

export function resetSystemStatusVisibilityAnalyzerForTests(): void {
  statusVisibilityAnalysisCount = 0;
}
