/**
 * Real Build Execution Pipeline V1 — execution metrics aggregation.
 */

import type {
  RealBuildCategoryResult,
  RealBuildExecutionMetrics,
} from './real-build-execution-pipeline-types.js';

export function computeExecutionMetrics(
  results: readonly RealBuildCategoryResult[],
): RealBuildExecutionMetrics {
  const total = results.length;
  if (total === 0) {
    return {
      readOnly: true,
      generationSuccessRate: 0,
      materializationSuccessRate: 0,
      buildSuccessRate: 0,
      previewSuccessRate: 0,
      verificationSuccessRate: 0,
      launchSuccessRate: 0,
      executionProofCompleteRate: 0,
    };
  }

  const rate = (flag: (result: RealBuildCategoryResult) => boolean) =>
    Math.round((results.filter(flag).length / total) * 100);

  return {
    readOnly: true,
    generationSuccessRate: rate((r) => r.metrics.generationSuccess),
    materializationSuccessRate: rate((r) => r.metrics.materializationSuccess),
    buildSuccessRate: rate((r) => r.metrics.buildSuccess),
    previewSuccessRate: rate((r) => r.metrics.previewSuccess),
    verificationSuccessRate: rate((r) => r.metrics.verificationSuccess),
    launchSuccessRate: rate((r) => r.metrics.launchSuccess),
    executionProofCompleteRate: rate((r) => r.metrics.executionProofComplete),
  };
}
