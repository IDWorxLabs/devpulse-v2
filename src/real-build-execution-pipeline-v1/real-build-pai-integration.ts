/**
 * Real Build Execution Pipeline V1 — Product Architect integration.
 */

import type { BuildExecutionProofEvidence } from './real-build-execution-pipeline-types.js';

export function assessExecutionRealityForProductArchitect(input: {
  architecturallyComplete: boolean;
  productReadinessScore: number;
  proof: BuildExecutionProofEvidence;
}): {
  actuallyRunning: boolean;
  executionRealityScore: number;
  gap: string | null;
} {
  const actuallyRunning =
    input.proof.buildOutputPresent &&
    input.proof.previewHtmlOk &&
    input.proof.previewShellOk &&
    input.proof.previewFeatureOk;

  const executionRealityScore = Math.round(
    (input.proof.buildOutputPresent ? 25 : 0) +
      (input.proof.previewHtmlOk ? 25 : 0) +
      (input.proof.previewShellOk ? 25 : 0) +
      (input.proof.previewFeatureOk ? 25 : 0),
  );

  let gap: string | null = null;
  if (input.architecturallyComplete && !actuallyRunning) {
    gap = 'Architecturally complete but not actually running';
  } else if (!input.architecturallyComplete && actuallyRunning) {
    gap = 'Running but product architecture gaps remain';
  }

  return { actuallyRunning, executionRealityScore, gap };
}
