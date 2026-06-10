/**
 * Visual QA Engine — spacing consistency analyzer.
 */

import type { SpacingConsistencyAnalysis, VisualQAInput } from './visual-qa-types.js';
import { SPACING_ANALYSIS_PASS, clampScore } from './visual-qa-types.js';
import { getCachedSpacingConsistency, setCachedSpacingConsistency } from './visual-qa-cache.js';

export interface SpacingConsistencySnapshot {
  cssSpacingTokens: number;
  mediaQueryCount: number;
}

let spacingAnalysisCount = 0;

export function analyzeSpacingConsistency(
  input: VisualQAInput,
  snapshot: SpacingConsistencySnapshot,
): SpacingConsistencyAnalysis {
  const cacheKey = [
    input.inconsistentSpacing,
    input.crowdedLayout,
    input.wastedSpace,
    snapshot.cssSpacingTokens,
  ].join('|');

  const cached = getCachedSpacingConsistency(cacheKey);
  if (cached) return cached;

  spacingAnalysisCount += 1;
  const spacingProblems: string[] = [];
  let penalty = 0;

  const inconsistentSpacing = input.inconsistentSpacing === true;
  const crowdedLayout = input.crowdedLayout === true;
  const wastedSpace = input.wastedSpace === true;

  if (inconsistentSpacing) { spacingProblems.push('INCONSISTENT_SPACING'); penalty += 18; }
  if (crowdedLayout) { spacingProblems.push('CROWDED_LAYOUT'); penalty += 16; }
  if (wastedSpace) { spacingProblems.push('WASTED_SPACE'); penalty += 12; }

  const rhythmBonus = Math.min(snapshot.cssSpacingTokens * 2, 14) + Math.min(snapshot.mediaQueryCount, 8);
  const spacingScore = clampScore(84 + rhythmBonus - penalty);

  const result: SpacingConsistencyAnalysis = {
    spacingScore,
    inconsistentSpacing,
    crowdedLayout,
    wastedSpace,
    spacingProblems,
    passToken: SPACING_ANALYSIS_PASS,
  };

  setCachedSpacingConsistency(cacheKey, result);
  return result;
}

export function getSpacingAnalysisCount(): number {
  return spacingAnalysisCount;
}

export function resetSpacingConsistencyAnalyzerForTests(): void {
  spacingAnalysisCount = 0;
}
