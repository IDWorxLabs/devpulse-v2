/**
 * Founder Readiness Authority — bounded readiness gap model.
 */

import type { ReadinessGap, ReadinessGapSeverity } from './founder-readiness-types.js';

const MAX_PER_ANALYZER = 8;
let gapCounter = 0;

export function resetReadinessGapCounterForTests(): void {
  gapCounter = 0;
}

export function createReadinessGap(params: {
  title: string;
  description: string;
  severity: ReadinessGapSeverity;
  analysisCode: string;
  sourceAnalyzer: string;
  readinessContext?: ReadinessGap['readinessContext'];
}): ReadinessGap {
  gapCounter += 1;
  return {
    gapId: `readiness-gap-${gapCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    analysisCode: params.analysisCode,
    sourceAnalyzer: params.sourceAnalyzer,
    readinessContext: params.readinessContext,
  };
}

export function boundGaps(gaps: ReadinessGap[], max = MAX_PER_ANALYZER): ReadinessGap[] {
  return gaps.slice(0, max);
}

export function mergeBoundedGaps(lists: ReadinessGap[][], maxTotal: number): ReadinessGap[] {
  const merged: ReadinessGap[] = [];
  for (const list of lists) {
    for (const gap of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(gap);
    }
  }
  return merged;
}

export function countCriticalGaps(gaps: readonly ReadinessGap[]): number {
  return gaps.filter((g) => g.severity === 'CRITICAL').length;
}

export const MAX_GAPS_PER_ANALYZER = MAX_PER_ANALYZER;
