/**
 * UX Heuristic Evaluator — action clarity analyzer.
 */

import type { ActionClarityAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { ACTION_CLARITY_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedActionClarity, setCachedActionClarity } from './ux-heuristic-cache.js';

export interface ActionClaritySnapshot {
  sendButtonPresent: boolean;
  chatFormPresent: boolean;
  notifButtonPresent: boolean;
}

let actionClarityAnalysisCount = 0;

export function analyzeActionClarity(
  input: UXHeuristicInput,
  snapshot: ActionClaritySnapshot,
): ActionClarityAnalysis {
  const cacheKey = [
    input.unclearAction,
    input.ambiguousButton,
    input.primaryActionHidden,
    snapshot.sendButtonPresent,
  ].join('|');

  const cached = getCachedActionClarity(cacheKey);
  if (cached) return cached;

  actionClarityAnalysisCount += 1;
  const actionProblems: string[] = [];
  let penalty = 0;

  const unclearAction = input.unclearAction === true;
  const ambiguousButton = input.ambiguousButton === true;
  const primaryActionHidden = input.primaryActionHidden === true;

  if (unclearAction) { actionProblems.push('UNCLEAR_ACTION'); penalty += 18; }
  if (ambiguousButton) { actionProblems.push('AMBIGUOUS_BUTTON'); penalty += 16; }
  if (primaryActionHidden) { actionProblems.push('PRIMARY_ACTION_HIDDEN'); penalty += 20; }

  const actionBonus =
    (snapshot.sendButtonPresent ? 14 : 0)
    + (snapshot.chatFormPresent ? 12 : 0)
    + (snapshot.notifButtonPresent ? 8 : 0);

  const actionClarityScore = clampScore(84 + actionBonus - penalty);

  const result: ActionClarityAnalysis = {
    actionClarityScore,
    unclearAction,
    ambiguousButton,
    primaryActionHidden,
    actionProblems,
    passToken: ACTION_CLARITY_PASS,
  };

  setCachedActionClarity(cacheKey, result);
  return result;
}

export function getActionClarityAnalysisCount(): number {
  return actionClarityAnalysisCount;
}

export function resetActionClarityAnalyzerForTests(): void {
  actionClarityAnalysisCount = 0;
}
