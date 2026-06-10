/**
 * UX Heuristic Evaluator — navigation clarity analyzer.
 */

import type { NavigationClarityAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { NAVIGATION_CLARITY_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedNavigationClarity, setCachedNavigationClarity } from './ux-heuristic-cache.js';

export interface NavigationClaritySnapshot {
  sidebarNavPresent: boolean;
  navItemCount: number;
  centerTitlePresent: boolean;
  mobileNavTogglePresent: boolean;
}

let navigationAnalysisCount = 0;

export function analyzeNavigationClarity(
  input: UXHeuristicInput,
  snapshot: NavigationClaritySnapshot,
): NavigationClarityAnalysis {
  const cacheKey = [
    input.navigationConfusion,
    input.unclearProductArea,
    input.missingLocationContext,
    snapshot.navItemCount,
  ].join('|');

  const cached = getCachedNavigationClarity(cacheKey);
  if (cached) return cached;

  navigationAnalysisCount += 1;
  const navigationProblems: string[] = [];
  let penalty = 0;

  const navigationConfusion = input.navigationConfusion === true;
  const unclearProductArea = input.unclearProductArea === true;
  const missingLocationContext = input.missingLocationContext === true;

  if (navigationConfusion) { navigationProblems.push('NAVIGATION_CONFUSION'); penalty += 20; }
  if (unclearProductArea) { navigationProblems.push('UNCLEAR_PRODUCT_AREA'); penalty += 18; }
  if (missingLocationContext) { navigationProblems.push('MISSING_LOCATION_CONTEXT'); penalty += 16; }

  const structureBonus =
    (snapshot.sidebarNavPresent ? 12 : 0)
    + (snapshot.centerTitlePresent ? 10 : 0)
    + (snapshot.mobileNavTogglePresent ? 8 : 0)
    + Math.min(snapshot.navItemCount * 2, 14);

  const navigationClarityScore = clampScore(86 + structureBonus - penalty);

  const result: NavigationClarityAnalysis = {
    navigationClarityScore,
    navigationConfusion,
    unclearProductArea,
    missingLocationContext,
    navigationProblems,
    passToken: NAVIGATION_CLARITY_PASS,
  };

  setCachedNavigationClarity(cacheKey, result);
  return result;
}

export function getNavigationAnalysisCount(): number {
  return navigationAnalysisCount;
}

export function resetNavigationClarityAnalyzerForTests(): void {
  navigationAnalysisCount = 0;
}
