/**
 * Visual QA Engine — color consistency analyzer.
 */

import type { ColorConsistencyAnalysis, VisualQAInput } from './visual-qa-types.js';
import { COLOR_ANALYSIS_PASS, clampScore } from './visual-qa-types.js';
import { getCachedColorConsistency, setCachedColorConsistency } from './visual-qa-cache.js';

export interface ColorConsistencySnapshot {
  themeVariablesPresent: boolean;
  accentColorPresent: boolean;
}

let colorAnalysisCount = 0;

export function analyzeColorConsistency(
  input: VisualQAInput,
  snapshot: ColorConsistencySnapshot,
): ColorConsistencyAnalysis {
  const cacheKey = [
    input.colorConflict,
    input.lowContrast,
    input.themeInconsistency,
    snapshot.themeVariablesPresent,
  ].join('|');

  const cached = getCachedColorConsistency(cacheKey);
  if (cached) return cached;

  colorAnalysisCount += 1;
  const colorProblems: string[] = [];
  let penalty = 0;

  const colorConflict = input.colorConflict === true;
  const lowContrast = input.lowContrast === true;
  const themeInconsistency = input.themeInconsistency === true;

  if (colorConflict) { colorProblems.push('COLOR_CONFLICT'); penalty += 18; }
  if (lowContrast) { colorProblems.push('LOW_CONTRAST'); penalty += 22; }
  if (themeInconsistency) { colorProblems.push('THEME_INCONSISTENCY'); penalty += 16; }

  const themeBonus =
    (snapshot.themeVariablesPresent ? 14 : 0)
    + (snapshot.accentColorPresent ? 12 : 0);

  const colorScore = clampScore(84 + themeBonus - penalty);

  const result: ColorConsistencyAnalysis = {
    colorScore,
    colorConflict,
    lowContrast,
    themeInconsistency,
    colorProblems,
    passToken: COLOR_ANALYSIS_PASS,
  };

  setCachedColorConsistency(cacheKey, result);
  return result;
}

export function getColorAnalysisCount(): number {
  return colorAnalysisCount;
}

export function resetColorConsistencyAnalyzerForTests(): void {
  colorAnalysisCount = 0;
}
