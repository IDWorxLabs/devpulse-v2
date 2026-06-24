/**
 * Real Build Execution Pipeline V1.1 — AFLA integration.
 */

import type { ProofCoverageReport } from './real-build-execution-pipeline-v11-types.js';

export function computeAflaProofCoveragePenalty(proofCoverage: ProofCoverageReport): {
  penalty: number;
  blockers: string[];
} {
  if (proofCoverage.proofCoveragePercent >= 100) {
    return { penalty: 0, blockers: [] };
  }

  const gap = proofCoverage.categoriesRequired - proofCoverage.categoriesWithFullProof;
  const penalty = Math.min(50, Math.round(gap * (50 / proofCoverage.categoriesRequired)));
  return {
    penalty,
    blockers: [
      `Execution proof incomplete: ${proofCoverage.categoriesWithFullProof}/${proofCoverage.categoriesRequired} categories`,
    ],
  };
}

export function adjustLaunchConfidenceForProofCoverage(input: {
  baseScore: number;
  proofCoverage: ProofCoverageReport;
}): number {
  const { penalty } = computeAflaProofCoveragePenalty(input.proofCoverage);
  return Math.max(0, input.baseScore - penalty);
}
