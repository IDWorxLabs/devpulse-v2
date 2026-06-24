/**
 * Mobile Runtime Validation at Scale V1 — AFLA mobile coverage adjustment.
 */

import type { MobileVerificationEvidence } from './mobile-runtime-validation-v1-types.js';

export function adjustAflaScoreForMobileCoverage(input: {
  baseScore: number;
  desktopProofComplete: boolean;
  mobileEvidence: MobileVerificationEvidence;
}): number {
  let score = input.baseScore;
  if (
    input.desktopProofComplete &&
    input.mobileEvidence.mobileCoveragePercent < 100
  ) {
    const gap = 100 - input.mobileEvidence.mobileCoveragePercent;
    score -= Math.min(20, Math.round(gap / 5));
  }
  if (input.mobileEvidence.mobileCoveragePercent >= 100) {
    score += 5;
  }
  return Math.max(0, Math.min(100, score));
}

export function mobileRuntimeCoveragePenalty(mobileCoveragePercent: number): number {
  if (mobileCoveragePercent >= 100) return 0;
  if (mobileCoveragePercent >= 80) return 5;
  if (mobileCoveragePercent >= 50) return 10;
  return 20;
}
