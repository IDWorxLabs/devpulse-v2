/**
 * UX Heuristic Evaluator — error prevention analyzer.
 */

import type { ErrorPreventionAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { ERROR_PREVENTION_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedErrorPrevention, setCachedErrorPrevention } from './ux-heuristic-cache.js';

export interface ErrorPreventionSnapshot {
  readOnlySurface: boolean;
  noExecutionEndpoints: boolean;
}

let errorPreventionAnalysisCount = 0;

export function analyzeErrorPrevention(
  input: UXHeuristicInput,
  snapshot: ErrorPreventionSnapshot,
): ErrorPreventionAnalysis {
  const cacheKey = [
    input.errorPreventionRisk,
    input.destructiveActionRisk,
    input.recoveryPathUnclear,
    snapshot.readOnlySurface,
  ].join('|');

  const cached = getCachedErrorPrevention(cacheKey);
  if (cached) return cached;

  errorPreventionAnalysisCount += 1;
  const errorPreventionProblems: string[] = [];
  let penalty = 0;

  const errorPreventionRisk = input.errorPreventionRisk === true;
  const destructiveActionRisk = input.destructiveActionRisk === true;
  const recoveryPathUnclear = input.recoveryPathUnclear === true;

  if (errorPreventionRisk) { errorPreventionProblems.push('ERROR_PREVENTION_RISK'); penalty += 18; }
  if (destructiveActionRisk) { errorPreventionProblems.push('DESTRUCTIVE_ACTION_RISK'); penalty += 22; }
  if (recoveryPathUnclear) { errorPreventionProblems.push('RECOVERY_PATH_UNCLEAR'); penalty += 16; }

  const preventionBonus =
    (snapshot.readOnlySurface ? 16 : 0)
    + (snapshot.noExecutionEndpoints ? 14 : 0);

  const errorPreventionScore = clampScore(80 + preventionBonus - penalty);

  const result: ErrorPreventionAnalysis = {
    errorPreventionScore,
    errorPreventionRisk,
    destructiveActionRisk,
    recoveryPathUnclear,
    errorPreventionProblems,
    passToken: ERROR_PREVENTION_PASS,
  };

  setCachedErrorPrevention(cacheKey, result);
  return result;
}

export function getErrorPreventionAnalysisCount(): number {
  return errorPreventionAnalysisCount;
}

export function resetErrorPreventionAnalyzerForTests(): void {
  errorPreventionAnalysisCount = 0;
}
