/**
 * Founder Productivity Validation — bounded productivity gap model.
 */

import type { ProductivityGap, ProductivityGapSeverity } from './founder-productivity-types.js';

const MAX_PER_VALIDATOR = 8;
let gapCounter = 0;

export function resetProductivityGapCounterForTests(): void {
  gapCounter = 0;
}

export function createProductivityGap(params: {
  title: string;
  description: string;
  severity: ProductivityGapSeverity;
  detectionCode: string;
  sourceValidator: string;
  productivityContext?: ProductivityGap['productivityContext'];
}): ProductivityGap {
  gapCounter += 1;
  return {
    gapId: `productivity-gap-${gapCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    detectionCode: params.detectionCode,
    sourceValidator: params.sourceValidator,
    productivityContext: params.productivityContext,
  };
}

export function boundGaps(gaps: ProductivityGap[], max = MAX_PER_VALIDATOR): ProductivityGap[] {
  return gaps.slice(0, max);
}

export function mergeBoundedGaps(lists: ProductivityGap[][], maxTotal: number): ProductivityGap[] {
  const merged: ProductivityGap[] = [];
  for (const list of lists) {
    for (const gap of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(gap);
    }
  }
  return merged;
}

export function countCriticalGaps(gaps: readonly ProductivityGap[]): number {
  return gaps.filter((g) => g.severity === 'CRITICAL').length;
}

export const MAX_GAPS_PER_VALIDATOR = MAX_PER_VALIDATOR;
