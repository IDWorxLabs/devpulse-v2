/**
 * Visual QA Engine — visual clutter analyzer.
 */

import type { VisualClutterAnalysis, VisualQAInput } from './visual-qa-types.js';
import { clampScore } from './visual-qa-types.js';
import { getCachedVisualClutter, setCachedVisualClutter } from './visual-qa-cache.js';

export interface VisualClutterSnapshot {
  diagnosticSectionCount: number;
  cardComponentPresent: boolean;
}

let clutterAnalysisCount = 0;

export function analyzeVisualClutter(
  input: VisualQAInput,
  snapshot: VisualClutterSnapshot,
): VisualClutterAnalysis {
  const cacheKey = [
    input.overcrowding,
    input.competingElements,
    input.excessiveDensity,
    snapshot.diagnosticSectionCount,
  ].join('|');

  const cached = getCachedVisualClutter(cacheKey);
  if (cached) return cached;

  clutterAnalysisCount += 1;
  const clutterProblems: string[] = [];
  let penalty = 0;

  const overcrowding = input.overcrowding === true;
  const competingElements = input.competingElements === true;
  const excessiveDensity = input.excessiveDensity === true;

  if (overcrowding) { clutterProblems.push('overcrowding'); penalty += 18; }
  if (competingElements) { clutterProblems.push('competing_elements'); penalty += 16; }
  if (excessiveDensity) { clutterProblems.push('excessive_information_density'); penalty += 20; }

  if (snapshot.diagnosticSectionCount > 8) {
    clutterProblems.push('high_diagnostic_surface_density');
    penalty += Math.min((snapshot.diagnosticSectionCount - 8) * 2, 12);
  }

  const clarityBonus = snapshot.cardComponentPresent ? 10 : 0;
  const clutterScore = clampScore(90 + clarityBonus - penalty);

  const result: VisualClutterAnalysis = {
    clutterScore,
    overcrowding,
    competingElements,
    excessiveDensity,
    clutterProblems,
  };

  setCachedVisualClutter(cacheKey, result);
  return result;
}

export function getClutterAnalysisCount(): number {
  return clutterAnalysisCount;
}

export function resetVisualClutterAnalyzerForTests(): void {
  clutterAnalysisCount = 0;
}
