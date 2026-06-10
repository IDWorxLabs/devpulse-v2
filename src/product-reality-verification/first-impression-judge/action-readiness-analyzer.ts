/**
 * First-Impression Judge — action readiness analyzer.
 */

import type { ActionReadinessAnalysis, FirstImpressionInput, FirstVisitContext } from './first-impression-types.js';
import { ACTION_READINESS_PASS, clampScore } from './first-impression-types.js';
import { getCachedActionReadiness, setCachedActionReadiness } from './first-impression-cache.js';

export interface ActionReadinessSnapshot {
  chatInputPresent: boolean;
  sendButtonPresent: boolean;
  welcomeStatePresent: boolean;
}

let actionReadinessAnalysisCount = 0;

export function analyzeActionReadiness(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: ActionReadinessSnapshot,
): ActionReadinessAnalysis {
  const cacheKey = [input.primaryActionUnclear, input.actionReadinessLow, context.persona].join('|');
  const cached = getCachedActionReadiness(cacheKey);
  if (cached) return cached;

  actionReadinessAnalysisCount += 1;
  const actionProblems: string[] = [];
  let penalty = 0;

  const primaryActionUnclear = input.primaryActionUnclear === true;
  const actionReadinessLow = input.actionReadinessLow === true;

  if (primaryActionUnclear) { actionProblems.push('PRIMARY_ACTION_UNCLEAR'); penalty += 24; }
  if (actionReadinessLow) { actionProblems.push('ACTION_READINESS_LOW'); penalty += 20; }

  const bonus =
    (snapshot.chatInputPresent ? 16 : 0)
    + (snapshot.sendButtonPresent ? 14 : 0)
    + (snapshot.welcomeStatePresent ? 10 : 0);

  const actionReadinessScore = clampScore(80 + bonus - penalty);

  const result: ActionReadinessAnalysis = {
    actionReadinessScore,
    primaryActionUnclear,
    actionReadinessLow,
    actionProblems,
    passToken: ACTION_READINESS_PASS,
  };
  setCachedActionReadiness(cacheKey, result);
  return result;
}

export function getActionReadinessAnalysisCount(): number {
  return actionReadinessAnalysisCount;
}

export function resetActionReadinessAnalyzerForTests(): void {
  actionReadinessAnalysisCount = 0;
}
