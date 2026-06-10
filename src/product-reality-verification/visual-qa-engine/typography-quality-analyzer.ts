/**
 * Visual QA Engine — typography quality analyzer.
 */

import type { TypographyQualityAnalysis, VisualQAInput } from './visual-qa-types.js';
import { TYPOGRAPHY_ANALYSIS_PASS, clampScore } from './visual-qa-types.js';
import { getCachedTypographyQuality, setCachedTypographyQuality } from './visual-qa-cache.js';

export interface TypographyQualitySnapshot {
  fontFamilyDefined: boolean;
  headingStylesPresent: boolean;
}

let typographyAnalysisCount = 0;

export function analyzeTypographyQuality(
  input: VisualQAInput,
  snapshot: TypographyQualitySnapshot,
): TypographyQualityAnalysis {
  const cacheKey = [
    input.missingFontConsistency,
    input.missingHeadingHierarchy,
    input.poorReadability,
    input.poorScanability,
    snapshot.fontFamilyDefined,
  ].join('|');

  const cached = getCachedTypographyQuality(cacheKey);
  if (cached) return cached;

  typographyAnalysisCount += 1;
  const typographyProblems: string[] = [];
  let penalty = 0;

  if (input.missingFontConsistency === true) {
    typographyProblems.push('font_inconsistency');
    penalty += 16;
  }
  if (input.missingHeadingHierarchy === true) {
    typographyProblems.push('heading_hierarchy_weak');
    penalty += 18;
  }
  if (input.poorReadability === true) {
    typographyProblems.push('poor_readability');
    penalty += 20;
  }
  if (input.poorScanability === true) {
    typographyProblems.push('poor_scanability');
    penalty += 14;
  }

  const typeBonus =
    (snapshot.fontFamilyDefined ? 12 : 0)
    + (snapshot.headingStylesPresent ? 10 : 0);

  const typographyScore = clampScore(86 + typeBonus - penalty);

  const result: TypographyQualityAnalysis = {
    typographyScore,
    typographyProblems,
    passToken: TYPOGRAPHY_ANALYSIS_PASS,
  };

  setCachedTypographyQuality(cacheKey, result);
  return result;
}

export function getTypographyAnalysisCount(): number {
  return typographyAnalysisCount;
}

export function resetTypographyQualityAnalyzerForTests(): void {
  typographyAnalysisCount = 0;
}
