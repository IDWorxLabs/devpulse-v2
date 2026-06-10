/**
 * UX Heuristic Evaluator — user control analyzer.
 */

import type { UserControlAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { USER_CONTROL_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedUserControl, setCachedUserControl } from './ux-heuristic-cache.js';

export interface UserControlSnapshot {
  navigationSwitchPresent: boolean;
  chatInputPresent: boolean;
  mobileEscapePresent: boolean;
}

let userControlAnalysisCount = 0;

export function analyzeUserControl(
  input: UXHeuristicInput,
  snapshot: UserControlSnapshot,
): UserControlAnalysis {
  const cacheKey = [
    input.userControlWeakness,
    input.noClearEscapePath,
    input.controlVisibilityRisk,
    snapshot.navigationSwitchPresent,
  ].join('|');

  const cached = getCachedUserControl(cacheKey);
  if (cached) return cached;

  userControlAnalysisCount += 1;
  const controlProblems: string[] = [];
  let penalty = 0;

  const userControlWeakness = input.userControlWeakness === true;
  const noClearEscapePath = input.noClearEscapePath === true;
  const controlVisibilityRisk = input.controlVisibilityRisk === true;

  if (userControlWeakness) { controlProblems.push('USER_CONTROL_WEAKNESS'); penalty += 18; }
  if (noClearEscapePath) { controlProblems.push('NO_CLEAR_ESCAPE_PATH'); penalty += 20; }
  if (controlVisibilityRisk) { controlProblems.push('CONTROL_VISIBILITY_RISK'); penalty += 14; }

  const controlBonus =
    (snapshot.navigationSwitchPresent ? 12 : 0)
    + (snapshot.chatInputPresent ? 14 : 0)
    + (snapshot.mobileEscapePresent ? 10 : 0);

  const userControlScore = clampScore(82 + controlBonus - penalty);

  const result: UserControlAnalysis = {
    userControlScore,
    userControlWeakness,
    noClearEscapePath,
    controlVisibilityRisk,
    controlProblems,
    passToken: USER_CONTROL_PASS,
  };

  setCachedUserControl(cacheKey, result);
  return result;
}

export function getUserControlAnalysisCount(): number {
  return userControlAnalysisCount;
}

export function resetUserControlAnalyzerForTests(): void {
  userControlAnalysisCount = 0;
}
