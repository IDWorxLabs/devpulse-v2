/**
 * Interaction Proof Engine — Live Preview gate.
 */

import type {
  InteractionProofPipelineResult,
  LivePreviewInteractionProofGateResult,
} from './interaction-proof-types.js';

export function evaluateLivePreviewInteractionProofGate(
  result: InteractionProofPipelineResult,
): LivePreviewInteractionProofGateResult {
  const failed = result.proofResults.find((r) => !r.passed && !r.skipJustification);
  const unlocked =
    result.permissionVerdict === 'READY_FOR_PREVIEW' &&
    result.wholeAppSweep.passed &&
    !failed;

  return {
    readOnly: true,
    unlocked,
    blockedReason: unlocked ? null : result.blockedReason ?? 'Interaction proof did not pass',
    affectedInteraction: failed?.label ?? null,
    affectedFeature: failed?.failure?.featureSliceId ?? null,
    failureCategory: failed?.failure?.category ?? null,
    expectedBehavior: failed?.failure?.expectedResult ?? null,
    observedBehavior: failed?.failure?.observedResult ?? null,
    responsibleComponent: failed?.failure?.responsibleArtifact ?? null,
    repairPlan: failed?.repairRecommendation?.suggestedRepairScope ?? null,
    gateStatus: unlocked ? 'INTERACTION_PROOF_PASS' : 'INTERACTION_PROOF_BLOCKED',
  };
}
