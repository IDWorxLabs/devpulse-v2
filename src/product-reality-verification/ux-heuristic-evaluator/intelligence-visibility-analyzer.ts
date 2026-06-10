/**
 * UX Heuristic Evaluator — intelligence visibility analyzer.
 */

import type { IntelligenceVisibilityAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { INTELLIGENCE_VISIBILITY_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedIntelligenceVisibility, setCachedIntelligenceVisibility } from './ux-heuristic-cache.js';

export interface IntelligenceVisibilitySnapshot {
  operatorFeedPresent: boolean;
  brainApiPresent: boolean;
  feedStreamPresent: boolean;
  welcomeIntelligenceCopyPresent: boolean;
}

let intelligenceVisibilityAnalysisCount = 0;

export function analyzeIntelligenceVisibility(
  input: UXHeuristicInput,
  snapshot: IntelligenceVisibilitySnapshot,
): IntelligenceVisibilityAnalysis {
  const cacheKey = [
    input.intelligenceHidden,
    input.reasoningNotVisible,
    input.smartSystemFeelsStatic,
    snapshot.operatorFeedPresent,
  ].join('|');

  const cached = getCachedIntelligenceVisibility(cacheKey);
  if (cached) return cached;

  intelligenceVisibilityAnalysisCount += 1;
  const intelligenceProblems: string[] = [];
  let penalty = 0;

  const intelligenceHidden = input.intelligenceHidden === true;
  const reasoningNotVisible = input.reasoningNotVisible === true;
  const smartSystemFeelsStatic = input.smartSystemFeelsStatic === true;

  if (intelligenceHidden) { intelligenceProblems.push('INTELLIGENCE_HIDDEN'); penalty += 22; }
  if (reasoningNotVisible) { intelligenceProblems.push('REASONING_NOT_VISIBLE'); penalty += 20; }
  if (smartSystemFeelsStatic) { intelligenceProblems.push('SMART_SYSTEM_FEELS_STATIC'); penalty += 18; }

  const visibilityBonus =
    (snapshot.operatorFeedPresent ? 16 : 0)
    + (snapshot.brainApiPresent ? 12 : 0)
    + (snapshot.feedStreamPresent ? 10 : 0)
    + (snapshot.welcomeIntelligenceCopyPresent ? 10 : 0);

  const intelligenceVisibilityScore = clampScore(78 + visibilityBonus - penalty);

  const result: IntelligenceVisibilityAnalysis = {
    intelligenceVisibilityScore,
    intelligenceHidden,
    reasoningNotVisible,
    smartSystemFeelsStatic,
    intelligenceProblems,
    passToken: INTELLIGENCE_VISIBILITY_PASS,
  };

  setCachedIntelligenceVisibility(cacheKey, result);
  return result;
}

export function getIntelligenceVisibilityAnalysisCount(): number {
  return intelligenceVisibilityAnalysisCount;
}

export function resetIntelligenceVisibilityAnalyzerForTests(): void {
  intelligenceVisibilityAnalysisCount = 0;
}
