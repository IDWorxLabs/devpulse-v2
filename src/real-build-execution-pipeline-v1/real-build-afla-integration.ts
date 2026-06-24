/**
 * Real Build Execution Pipeline V1 — AFLA integration.
 * AFLA must never approve launch without execution evidence.
 */

import type { BuildExecutionProofEvidence } from './real-build-execution-pipeline-types.js';

export function computeAflaExecutionProofPenalty(proof: BuildExecutionProofEvidence): {
  penalty: number;
  blockers: string[];
} {
  const blockers: string[] = [];
  let penalty = 0;

  if (!proof.buildOutputPresent) {
    penalty += 25;
    blockers.push('Build output missing');
  }
  if (!proof.livePreviewUrl && !proof.previewHtmlOk) {
    penalty += 20;
    blockers.push('Preview proof missing');
  }
  if (!proof.previewShellOk) {
    penalty += 10;
    blockers.push('Application shell not verified in preview');
  }
  if (!proof.previewFeatureOk) {
    penalty += 10;
    blockers.push('Core feature not verified in preview');
  }
  if (proof.missingEvidence.length > 0) {
    penalty += Math.min(20, proof.missingEvidence.length * 4);
    blockers.push(...proof.missingEvidence.slice(0, 3));
  }

  return { penalty: Math.min(60, penalty), blockers };
}

export function adjustAflaScoreForExecutionProof(input: {
  baseScore: number;
  proof: BuildExecutionProofEvidence;
  passed: boolean;
}): { adjustedScore: number; launchApproved: boolean; blockers: string[] } {
  const { penalty, blockers } = computeAflaExecutionProofPenalty(input.proof);
  const adjustedScore = Math.max(0, input.baseScore - penalty);
  const launchApproved =
    input.passed &&
    input.proof.proofComplete &&
    penalty === 0 &&
    blockers.length === 0;

  return { adjustedScore, launchApproved, blockers };
}
