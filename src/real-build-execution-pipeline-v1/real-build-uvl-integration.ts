/**
 * Real Build Execution Pipeline V1 — UVL integration.
 */

import type {
  BuildExecutionProofEvidence,
  RealBuildExecutionMetrics,
} from './real-build-execution-pipeline-types.js';

export function computeUvlExecutionProofPenalty(input: {
  metrics: RealBuildExecutionMetrics;
  proof: BuildExecutionProofEvidence;
}): number {
  let penalty = 0;
  if (input.metrics.buildSuccessRate < 70) penalty += 15;
  if (input.metrics.previewSuccessRate < 60) penalty += 10;
  if (!input.proof.buildOutputPresent) penalty += 15;
  if (!input.proof.previewHtmlOk) penalty += 10;
  if (input.proof.missingEvidence.length > 0) penalty += Math.min(15, input.proof.missingEvidence.length * 3);
  return Math.min(50, penalty);
}

export function adjustVerificationConfidence(input: {
  baseConfidence: number;
  metrics: RealBuildExecutionMetrics;
  proof: BuildExecutionProofEvidence;
}): number {
  const penalty = computeUvlExecutionProofPenalty({
    metrics: input.metrics,
    proof: input.proof,
  });
  return Math.max(0, input.baseConfidence - penalty);
}
