/**
 * Founder Friction Detector — bounded friction gap model.
 */

import type { FrictionGap, FrictionGapSeverity } from './founder-friction-types.js';

const MAX_PER_DETECTOR = 8;
let gapCounter = 0;

export function resetFrictionGapCounterForTests(): void {
  gapCounter = 0;
}

export function createFrictionGap(params: {
  title: string;
  description: string;
  severity: FrictionGapSeverity;
  detectionCode: string;
  sourceDetector: string;
  frictionContext?: FrictionGap['frictionContext'];
}): FrictionGap {
  gapCounter += 1;
  return {
    gapId: `friction-gap-${gapCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    detectionCode: params.detectionCode,
    sourceDetector: params.sourceDetector,
    frictionContext: params.frictionContext,
  };
}

export function boundGaps(gaps: FrictionGap[], max = MAX_PER_DETECTOR): FrictionGap[] {
  return gaps.slice(0, max);
}

export function mergeBoundedGaps(lists: FrictionGap[][], maxTotal: number): FrictionGap[] {
  const merged: FrictionGap[] = [];
  for (const list of lists) {
    for (const gap of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(gap);
    }
  }
  return merged;
}

export function countCriticalGaps(gaps: readonly FrictionGap[]): number {
  return gaps.filter((g) => g.severity === 'CRITICAL').length;
}

export const MAX_GAPS_PER_DETECTOR = MAX_PER_DETECTOR;
