/**
 * Visual QA Engine — desktop visual analyzer.
 */

import type { DesktopVisualAnalysis, VisualQAInput } from './visual-qa-types.js';
import { DESKTOP_VISUAL_PASS, clampScore } from './visual-qa-types.js';
import { getCachedDesktopVisual, setCachedDesktopVisual } from './visual-qa-cache.js';

export interface DesktopVisualSnapshot {
  threeColumnGridPresent: boolean;
  operatorFeedPresent: boolean;
  wideViewportRulesPresent: boolean;
}

let desktopAnalysisCount = 0;

export function analyzeDesktopVisual(
  input: VisualQAInput,
  snapshot: DesktopVisualSnapshot,
): DesktopVisualAnalysis {
  const cacheKey = [
    input.desktopLayoutFailure,
    input.desktopUnusedSpace,
    snapshot.threeColumnGridPresent,
    snapshot.operatorFeedPresent,
  ].join('|');

  const cached = getCachedDesktopVisual(cacheKey);
  if (cached) return cached;

  desktopAnalysisCount += 1;
  const desktopProblems: string[] = [];
  let penalty = 0;

  const desktopLayoutFailure = input.desktopLayoutFailure === true;
  const desktopUnusedSpace = input.desktopUnusedSpace === true;

  if (desktopLayoutFailure) { desktopProblems.push('DESKTOP_LAYOUT_FAILURE'); penalty += 22; }
  if (desktopUnusedSpace) { desktopProblems.push('DESKTOP_UNUSED_SPACE'); penalty += 14; }

  const desktopBonus =
    (snapshot.threeColumnGridPresent ? 14 : 0)
    + (snapshot.operatorFeedPresent ? 12 : 0)
    + (snapshot.wideViewportRulesPresent ? 8 : 0);

  const desktopScore = clampScore(82 + desktopBonus - penalty);

  const result: DesktopVisualAnalysis = {
    desktopScore,
    desktopLayoutFailure,
    desktopUnusedSpace,
    desktopProblems,
    passToken: DESKTOP_VISUAL_PASS,
  };

  setCachedDesktopVisual(cacheKey, result);
  return result;
}

export function getDesktopAnalysisCount(): number {
  return desktopAnalysisCount;
}

export function resetDesktopVisualAnalyzerForTests(): void {
  desktopAnalysisCount = 0;
}
