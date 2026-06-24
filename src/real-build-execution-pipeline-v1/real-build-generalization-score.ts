/**
 * Real Build Execution Pipeline V1 — execution generalization score.
 */

import type { RealBuildExecutionMetrics } from './real-build-execution-pipeline-types.js';

export function computeExecutionGeneralizationScore(input: {
  metrics: RealBuildExecutionMetrics;
  categoriesTested: number;
  minCategories: number;
}): number {
  const coverageFactor =
    input.categoriesTested >= input.minCategories
      ? 100
      : Math.round((input.categoriesTested / input.minCategories) * 100);

  const weighted =
    input.metrics.generationSuccessRate * 0.15 +
    input.metrics.materializationSuccessRate * 0.15 +
    input.metrics.buildSuccessRate * 0.25 +
    input.metrics.previewSuccessRate * 0.15 +
    input.metrics.verificationSuccessRate * 0.1 +
    input.metrics.launchSuccessRate * 0.1 +
    input.metrics.executionProofCompleteRate * 0.1;

  return Math.round(Math.min(100, weighted * (coverageFactor / 100)));
}
