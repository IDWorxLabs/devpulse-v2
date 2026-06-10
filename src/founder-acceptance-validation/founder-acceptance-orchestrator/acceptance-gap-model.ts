/**
 * Founder Acceptance Orchestrator — bounded acceptance gap model.
 */

import type { AcceptanceGap, AcceptanceGapSeverity } from './founder-acceptance-orchestrator-types.js';

const MAX_PER_ANALYZER = 8;
let gapCounter = 0;

export function resetAcceptanceGapCounterForTests(): void {
  gapCounter = 0;
}

export function createAcceptanceGap(params: {
  title: string;
  description: string;
  severity: AcceptanceGapSeverity;
  analysisCode: string;
  sourceAnalyzer: string;
}): AcceptanceGap {
  gapCounter += 1;
  return {
    gapId: `acceptance-gap-${gapCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    analysisCode: params.analysisCode,
    sourceAnalyzer: params.sourceAnalyzer,
  };
}

export function boundGaps(gaps: AcceptanceGap[], max = MAX_PER_ANALYZER): AcceptanceGap[] {
  return gaps.slice(0, max);
}

export function mergeBoundedGaps(lists: AcceptanceGap[][], maxTotal: number): AcceptanceGap[] {
  const merged: AcceptanceGap[] = [];
  for (const list of lists) {
    for (const gap of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(gap);
    }
  }
  return merged;
}

export function countCriticalGaps(gaps: readonly AcceptanceGap[]): number {
  return gaps.filter((g) => g.severity === 'CRITICAL').length;
}

export const MAX_GAPS_PER_ANALYZER = MAX_PER_ANALYZER;
