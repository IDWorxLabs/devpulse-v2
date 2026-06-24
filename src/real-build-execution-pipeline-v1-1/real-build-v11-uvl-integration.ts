/**
 * Real Build Execution Pipeline V1.1 — UVL integration.
 */

import type { ExecutionMatrixEntry } from './real-build-execution-pipeline-v11-types.js';
import type { ProofCoverageReport } from './real-build-execution-pipeline-v11-types.js';

export function adjustUvlConfidenceForProofCoverage(input: {
  baseConfidence: number;
  proofCoverage: ProofCoverageReport;
  executionMatrix: readonly ExecutionMatrixEntry[];
}): number {
  const matrixPassRate =
    input.executionMatrix.length === 0
      ? 0
      : input.executionMatrix.filter((e) => e.proofComplete).length /
        input.executionMatrix.length;

  const boost = Math.round(input.proofCoverage.proofCoveragePercent * 0.25);
  const matrixBoost = Math.round(matrixPassRate * 15);
  const penalty =
    input.proofCoverage.proofCoveragePercent < 100
      ? Math.round((100 - input.proofCoverage.proofCoveragePercent) * 0.35)
      : 0;

  return Math.max(0, Math.min(100, input.baseConfidence + boost + matrixBoost - penalty));
}
