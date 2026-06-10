/**
 * First-Impression Judge — visual confidence analyzer.
 */

import type { FirstImpressionInput, FirstVisitContext, VisualConfidenceAnalysis } from './first-impression-types.js';
import { VISUAL_CONFIDENCE_PASS, clampScore } from './first-impression-types.js';
import { getCachedVisualConfidence, setCachedVisualConfidence } from './first-impression-cache.js';

export interface VisualConfidenceSnapshot {
  brandedShellPresent: boolean;
  themeVariablesPresent: boolean;
  welcomeIconPresent: boolean;
}

let visualConfidenceAnalysisCount = 0;

export function analyzeVisualConfidence(
  input: FirstImpressionInput,
  context: FirstVisitContext,
  snapshot: VisualConfidenceSnapshot,
): VisualConfidenceAnalysis {
  const cacheKey = [input.visualConfidenceLow, input.productFeelsUnfinished, context.persona].join('|');
  const cached = getCachedVisualConfidence(cacheKey);
  if (cached) return cached;

  visualConfidenceAnalysisCount += 1;
  const visualProblems: string[] = [];
  let penalty = 0;

  const visualConfidenceLow = input.visualConfidenceLow === true;
  const productFeelsUnfinished = input.productFeelsUnfinished === true;

  if (visualConfidenceLow) { visualProblems.push('VISUAL_CONFIDENCE_LOW'); penalty += 22; }
  if (productFeelsUnfinished) { visualProblems.push('PRODUCT_FEELS_UNFINISHED'); penalty += 20; }

  const bonus =
    (snapshot.brandedShellPresent ? 14 : 0)
    + (snapshot.themeVariablesPresent ? 12 : 0)
    + (snapshot.welcomeIconPresent ? 10 : 0);

  const visualConfidenceScore = clampScore(80 + bonus - penalty);

  const result: VisualConfidenceAnalysis = {
    visualConfidenceScore,
    visualConfidenceLow,
    productFeelsUnfinished,
    visualProblems,
    passToken: VISUAL_CONFIDENCE_PASS,
  };
  setCachedVisualConfidence(cacheKey, result);
  return result;
}

export function getVisualConfidenceAnalysisCount(): number {
  return visualConfidenceAnalysisCount;
}

export function resetVisualConfidenceAnalyzerForTests(): void {
  visualConfidenceAnalysisCount = 0;
}
