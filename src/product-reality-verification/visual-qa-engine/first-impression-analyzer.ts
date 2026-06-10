/**
 * Visual QA Engine — first impression analyzer.
 */

import type { FirstImpressionAnalysis, VisualQAInput } from './visual-qa-types.js';
import { FIRST_IMPRESSION_PASS, clampScore } from './visual-qa-types.js';
import { getCachedFirstImpression, setCachedFirstImpression } from './visual-qa-cache.js';

export interface FirstImpressionSnapshot {
  brandedShellPresent: boolean;
  welcomeCopyPresent: boolean;
  accentThemePresent: boolean;
}

let firstImpressionAnalysisCount = 0;

export function analyzeFirstImpression(
  input: VisualQAInput,
  snapshot: FirstImpressionSnapshot,
): FirstImpressionAnalysis {
  const cacheKey = [
    input.lacksModernFeel,
    input.lacksIntelligentFeel,
    input.lacksTrustworthyFeel,
    input.lacksPolishedFeel,
    input.lacksPremiumFeel,
    snapshot.brandedShellPresent,
  ].join('|');

  const cached = getCachedFirstImpression(cacheKey);
  if (cached) return cached;

  firstImpressionAnalysisCount += 1;
  const firstImpressionProblems: string[] = [];
  let penalty = 0;

  const feelsModern = input.lacksModernFeel !== true;
  const feelsIntelligent = input.lacksIntelligentFeel !== true;
  const feelsTrustworthy = input.lacksTrustworthyFeel !== true;
  const feelsPolished = input.lacksPolishedFeel !== true;
  const feelsPremium = input.lacksPremiumFeel !== true;

  if (!feelsModern) { firstImpressionProblems.push('lacks_modern_feel'); penalty += 14; }
  if (!feelsIntelligent) { firstImpressionProblems.push('lacks_intelligent_feel'); penalty += 14; }
  if (!feelsTrustworthy) { firstImpressionProblems.push('lacks_trustworthy_feel'); penalty += 16; }
  if (!feelsPolished) { firstImpressionProblems.push('lacks_polished_feel'); penalty += 14; }
  if (!feelsPremium) { firstImpressionProblems.push('lacks_premium_feel'); penalty += 16; }

  const impressionBonus =
    (snapshot.brandedShellPresent ? 12 : 0)
    + (snapshot.welcomeCopyPresent ? 10 : 0)
    + (snapshot.accentThemePresent ? 10 : 0);

  const firstImpressionScore = clampScore(80 + impressionBonus - penalty);

  const result: FirstImpressionAnalysis = {
    firstImpressionScore,
    feelsModern,
    feelsIntelligent,
    feelsTrustworthy,
    feelsPolished,
    feelsPremium,
    firstImpressionProblems,
    passToken: FIRST_IMPRESSION_PASS,
  };

  setCachedFirstImpression(cacheKey, result);
  return result;
}

export function getFirstImpressionAnalysisCount(): number {
  return firstImpressionAnalysisCount;
}

export function resetFirstImpressionAnalyzerForTests(): void {
  firstImpressionAnalysisCount = 0;
}
