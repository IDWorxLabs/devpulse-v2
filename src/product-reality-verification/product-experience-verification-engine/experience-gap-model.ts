/**
 * Product Experience Verification Engine — bounded experience gap model.
 */

import type { ExperienceGap, ExperienceSeverity } from './product-experience-types.js';

const MAX_PER_VERIFIER = 8;
let gapCounter = 0;

export function resetExperienceGapCounterForTests(): void {
  gapCounter = 0;
}

export function createExperienceGap(params: {
  title: string;
  description: string;
  severity: ExperienceSeverity;
  detectionCode: string;
  sourceVerifier: string;
  connectedSystems: string[];
}): ExperienceGap {
  gapCounter += 1;
  return {
    gapId: `experience-gap-${gapCounter}`,
    title: params.title,
    description: params.description,
    severity: params.severity,
    detectionCode: params.detectionCode,
    sourceVerifier: params.sourceVerifier,
    connectedSystems: params.connectedSystems.slice(0, 6),
  };
}

export function boundGaps(gaps: ExperienceGap[], max = MAX_PER_VERIFIER): ExperienceGap[] {
  return gaps.slice(0, max);
}

export function mergeBoundedGaps(lists: ExperienceGap[][], maxTotal: number): ExperienceGap[] {
  const merged: ExperienceGap[] = [];
  for (const list of lists) {
    for (const gap of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(gap);
    }
  }
  return merged;
}

export function countCriticalGaps(gaps: readonly ExperienceGap[]): number {
  return gaps.filter((g) => g.severity === 'CRITICAL').length;
}

export const MAX_GAPS_PER_VERIFIER = MAX_PER_VERIFIER;
