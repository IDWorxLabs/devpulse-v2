/**
 * First-Impression Judge — founder usefulness analyzer.
 */

import type { FirstImpressionInput, FirstVisitContext, FounderUsefulnessAnalysis } from './first-impression-types.js';
import { FOUNDER_USEFULNESS_PASS, clampScore } from './first-impression-types.js';
import { getCachedFounderUsefulness, setCachedFounderUsefulness } from './first-impression-cache.js';

export interface FounderUsefulnessSnapshot {
  chatFirstLayout: boolean;
  operatorFeedPresent: boolean;
  nextStepSectionPresent: boolean;
  statusBarPresent: boolean;
}

let founderUsefulnessAnalysisCount = 0;

export function analyzeFounderUsefulness(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: FounderUsefulnessSnapshot,
): FounderUsefulnessAnalysis {
  const cacheKey = [input.founderValueNotImmediate, input.founderNextStepUnclear, input.founderProgressHidden, context.persona].join('|');
  const cached = getCachedFounderUsefulness(cacheKey);
  if (cached) return cached;

  founderUsefulnessAnalysisCount += 1;
  const founderProblems: string[] = [];
  let penalty = 0;

  const founderValueNotImmediate = input.founderValueNotImmediate === true;
  const founderNextStepUnclear = input.founderNextStepUnclear === true;
  const founderProgressHidden = input.founderProgressHidden === true;

  if (founderValueNotImmediate) { founderProblems.push('FOUNDER_VALUE_NOT_IMMEDIATE'); penalty += 22; }
  if (founderNextStepUnclear) { founderProblems.push('FOUNDER_NEXT_STEP_UNCLEAR'); penalty += 20; }
  if (founderProgressHidden) { founderProblems.push('FOUNDER_PROGRESS_HIDDEN'); penalty += 16; }

  const bonus =
    (snapshot.chatFirstLayout ? 14 : 0)
    + (snapshot.operatorFeedPresent ? 12 : 0)
    + (snapshot.nextStepSectionPresent ? 10 : 0)
    + (snapshot.statusBarPresent ? 8 : 0);

  const founderUsefulnessScore = clampScore(78 + bonus - penalty);

  const result: FounderUsefulnessAnalysis = {
    founderUsefulnessScore,
    founderValueNotImmediate,
    founderNextStepUnclear,
    founderProgressHidden,
    founderProblems,
    passToken: FOUNDER_USEFULNESS_PASS,
  };
  setCachedFounderUsefulness(cacheKey, result);
  return result;
}

export function getFounderUsefulnessAnalysisCount(): number {
  return founderUsefulnessAnalysisCount;
}

export function resetFounderUsefulnessAnalyzerForTests(): void {
  founderUsefulnessAnalysisCount = 0;
}
