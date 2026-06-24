/**
 * Real Build Execution Pipeline V1.1 — generalization score V2.
 */

import type { RealBuildExecutionMetrics } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';
import type { ProofCoverageReport } from './real-build-execution-pipeline-v11-types.js';

export function computeExecutionGeneralizationScoreV2(input: {
  metrics: RealBuildExecutionMetrics;
  proofCoverage: ProofCoverageReport;
}): number {
  const coverage = input.proofCoverage.proofCoveragePercent;
  const consistency =
    (input.metrics.buildSuccessRate +
      input.metrics.previewSuccessRate +
      input.metrics.verificationSuccessRate +
      input.metrics.launchSuccessRate) /
    4;

  const weighted =
    coverage * 0.4 +
    input.metrics.generationSuccessRate * 0.1 +
    input.metrics.materializationSuccessRate * 0.1 +
    input.metrics.buildSuccessRate * 0.15 +
    input.metrics.previewSuccessRate * 0.1 +
    consistency * 0.15;

  return Math.round(Math.min(100, weighted));
}
