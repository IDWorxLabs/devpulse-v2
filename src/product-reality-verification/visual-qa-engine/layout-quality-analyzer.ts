/**
 * Visual QA Engine — layout quality analyzer.
 */

import type { LayoutQualityAnalysis, VisualQAInput } from './visual-qa-types.js';
import { LAYOUT_QUALITY_PASS, clampScore } from './visual-qa-types.js';
import { getCachedLayoutQuality, setCachedLayoutQuality } from './visual-qa-cache.js';

export interface LayoutQualitySnapshot {
  panelCount: number;
  hasThreeColumnLayout: boolean;
  hasResponsiveRules: boolean;
}

let layoutAnalysisCount = 0;

export function analyzeLayoutQuality(
  input: VisualQAInput,
  snapshot: LayoutQualitySnapshot,
): LayoutQualityAnalysis {
  const cacheKey = [
    input.layoutImbalance,
    input.layoutFragmentation,
    input.layoutConfusion,
    snapshot.panelCount,
    snapshot.hasThreeColumnLayout,
  ].join('|');

  const cached = getCachedLayoutQuality(cacheKey);
  if (cached) return cached;

  layoutAnalysisCount += 1;
  const layoutProblems: string[] = [];
  let penalty = 0;

  const layoutImbalance = input.layoutImbalance === true;
  const layoutFragmentation = input.layoutFragmentation === true;
  const layoutConfusion = input.layoutConfusion === true;

  if (layoutImbalance) { layoutProblems.push('LAYOUT_IMBALANCE'); penalty += 20; }
  if (layoutFragmentation) { layoutProblems.push('LAYOUT_FRAGMENTATION'); penalty += 18; }
  if (layoutConfusion) { layoutProblems.push('LAYOUT_CONFUSION'); penalty += 22; }

  const structureBonus =
    (snapshot.hasThreeColumnLayout ? 14 : 0)
    + (snapshot.hasResponsiveRules ? 10 : 0)
    + Math.min(snapshot.panelCount * 2, 12);

  const layoutScore = clampScore(86 + structureBonus - penalty);

  const result: LayoutQualityAnalysis = {
    layoutScore,
    layoutImbalance,
    layoutFragmentation,
    layoutConfusion,
    layoutProblems,
    passToken: LAYOUT_QUALITY_PASS,
  };

  setCachedLayoutQuality(cacheKey, result);
  return result;
}

export function getLayoutAnalysisCount(): number {
  return layoutAnalysisCount;
}

export function resetLayoutQualityAnalyzerForTests(): void {
  layoutAnalysisCount = 0;
}
