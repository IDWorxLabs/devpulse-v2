/**
 * Founder Trust Validation — bounded trust gap model.
 */

import type { TrustGap, TrustGapSeverity } from './founder-trust-types.js';

const MAX_PER_VALIDATOR = 8;
let gapCounter = 0;

export function resetTrustGapCounterForTests(): void {
  gapCounter = 0;
}

export function createTrustGap(params: {
  title: string;
  description: string;
  severity: TrustGapSeverity;
  detectionCode: string;
  sourceValidator: string;
  trustContext?: TrustGap['trustContext'];
}): TrustGap {
  gapCounter += 1;
  return {
    gapId: `trust-gap-${gapCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    detectionCode: params.detectionCode,
    sourceValidator: params.sourceValidator,
    trustContext: params.trustContext,
  };
}

export function boundGaps(gaps: TrustGap[], max = MAX_PER_VALIDATOR): TrustGap[] {
  return gaps.slice(0, max);
}

export function mergeBoundedGaps(lists: TrustGap[][], maxTotal: number): TrustGap[] {
  const merged: TrustGap[] = [];
  for (const list of lists) {
    for (const gap of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(gap);
    }
  }
  return merged;
}

export function countCriticalGaps(gaps: readonly TrustGap[]): number {
  return gaps.filter((g) => g.severity === 'CRITICAL').length;
}

export const MAX_GAPS_PER_VALIDATOR = MAX_PER_VALIDATOR;
