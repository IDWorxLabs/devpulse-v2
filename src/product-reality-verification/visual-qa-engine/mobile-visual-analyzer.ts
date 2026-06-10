/**
 * Visual QA Engine — mobile visual analyzer.
 */

import type { MobileVisualAnalysis, VisualQAInput } from './visual-qa-types.js';
import { MOBILE_VISUAL_PASS, clampScore } from './visual-qa-types.js';
import { getCachedMobileVisual, setCachedMobileVisual } from './visual-qa-cache.js';

export interface MobileVisualSnapshot {
  mobileMediaQueries: number;
  mobileNavTogglePresent: boolean;
  mobileFeedTogglePresent: boolean;
}

let mobileAnalysisCount = 0;

export function analyzeMobileVisual(
  input: VisualQAInput,
  snapshot: MobileVisualSnapshot,
): MobileVisualAnalysis {
  const cacheKey = [
    input.mobileLayoutFailure,
    input.mobileDiscoverabilityRisk,
    input.mobileOverflowRisk,
    snapshot.mobileMediaQueries,
    snapshot.mobileNavTogglePresent,
  ].join('|');

  const cached = getCachedMobileVisual(cacheKey);
  if (cached) return cached;

  mobileAnalysisCount += 1;
  const mobileProblems: string[] = [];
  let penalty = 0;

  const mobileLayoutFailure = input.mobileLayoutFailure === true;
  const mobileDiscoverabilityRisk = input.mobileDiscoverabilityRisk === true;
  const mobileOverflowRisk = input.mobileOverflowRisk === true;

  if (mobileLayoutFailure) { mobileProblems.push('MOBILE_LAYOUT_FAILURE'); penalty += 24; }
  if (mobileDiscoverabilityRisk) { mobileProblems.push('MOBILE_DISCOVERABILITY_RISK'); penalty += 18; }
  if (mobileOverflowRisk) { mobileProblems.push('MOBILE_OVERFLOW_RISK'); penalty += 16; }

  const mobileBonus =
    Math.min(snapshot.mobileMediaQueries * 4, 16)
    + (snapshot.mobileNavTogglePresent ? 10 : 0)
    + (snapshot.mobileFeedTogglePresent ? 8 : 0);

  const mobileScore = clampScore(78 + mobileBonus - penalty);

  const result: MobileVisualAnalysis = {
    mobileScore,
    mobileLayoutFailure,
    mobileDiscoverabilityRisk,
    mobileOverflowRisk,
    mobileProblems,
    passToken: MOBILE_VISUAL_PASS,
  };

  setCachedMobileVisual(cacheKey, result);
  return result;
}

export function getMobileAnalysisCount(): number {
  return mobileAnalysisCount;
}

export function resetMobileVisualAnalyzerForTests(): void {
  mobileAnalysisCount = 0;
}
