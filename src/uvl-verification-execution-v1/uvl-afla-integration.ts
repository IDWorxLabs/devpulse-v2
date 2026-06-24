/**
 * UVL Verification Execution V1 — AFLA integration.
 */

import type { VerificationCoverageReport } from './uvl-verification-execution-v1-types.js';

export function computeAflaVerificationCoveragePenalty(coverage: VerificationCoverageReport): {
  penalty: number;
  blockers: string[];
} {
  if (coverage.verificationCoveragePercent >= 100) {
    return { penalty: 0, blockers: [] };
  }

  const gap = coverage.categoriesRequired - coverage.verifiedCount;
  const penalty = Math.min(45, Math.round(gap * (45 / coverage.categoriesRequired)));
  const blockers = [
    `Verification coverage incomplete: ${coverage.verifiedCount}/${coverage.categoriesRequired} categories verified`,
  ];

  if (coverage.failedCount > 0) {
    blockers.push(`${coverage.failedCount} categories failed verification`);
  }

  return { penalty, blockers };
}

export function adjustLaunchConfidenceForVerificationCoverage(input: {
  baseScore: number;
  coverage: VerificationCoverageReport;
  criticalFailureCount: number;
}): { adjustedScore: number; blocked: boolean; blockers: string[] } {
  const { penalty, blockers } = computeAflaVerificationCoveragePenalty(input.coverage);
  let adjustedScore = Math.max(0, input.baseScore - penalty);

  const criticalBlockers = [...blockers];
  if (input.criticalFailureCount > 0) {
    criticalBlockers.push(`${input.criticalFailureCount} critical verification failures`);
    adjustedScore = Math.min(adjustedScore, 55);
  }

  const blocked =
    input.coverage.verificationCoveragePercent < 100 || input.criticalFailureCount > 0;

  return { adjustedScore, blocked, blockers: criticalBlockers };
}
