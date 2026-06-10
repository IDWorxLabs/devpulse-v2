/**
 * Founder Confidence Engine — bounded confidence gap model.
 */

import type { ConfidenceGap, ConfidenceGapSeverity } from './founder-confidence-types.js';

const MAX_PER_VALIDATOR = 8;
let gapCounter = 0;

export function resetConfidenceGapCounterForTests(): void {
  gapCounter = 0;
}

export function createConfidenceGap(params: {
  title: string;
  description: string;
  severity: ConfidenceGapSeverity;
  detectionCode: string;
  sourceValidator: string;
  confidenceContext?: ConfidenceGap['confidenceContext'];
}): ConfidenceGap {
  gapCounter += 1;
  return {
    gapId: `confidence-gap-${gapCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    detectionCode: params.detectionCode,
    sourceValidator: params.sourceValidator,
    confidenceContext: params.confidenceContext,
  };
}

export function boundGaps(gaps: ConfidenceGap[], max = MAX_PER_VALIDATOR): ConfidenceGap[] {
  return gaps.slice(0, max);
}

export function mergeBoundedGaps(lists: ConfidenceGap[][], maxTotal: number): ConfidenceGap[] {
  const merged: ConfidenceGap[] = [];
  for (const list of lists) {
    for (const gap of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(gap);
    }
  }
  return merged;
}

export function countCriticalGaps(gaps: readonly ConfidenceGap[]): number {
  return gaps.filter((g) => g.severity === 'CRITICAL').length;
}

export const MAX_GAPS_PER_VALIDATOR = MAX_PER_VALIDATOR;
