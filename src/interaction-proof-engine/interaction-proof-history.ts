/**
 * Interaction Proof Engine — history.
 */

import { DEFAULT_MAX_INTERACTION_PROOF_HISTORY } from './interaction-proof-types.js';
import type { InteractionProofPipelineResult } from './interaction-proof-types.js';

const history: Array<{ pipelineId: string; verdict: string; completedAt: number }> = [];

export function resetInteractionProofHistoryForTests(): void {
  history.length = 0;
}

export function recordInteractionProofHistory(result: InteractionProofPipelineResult): void {
  history.push({
    pipelineId: result.pipelineId,
    verdict: result.permissionVerdict,
    completedAt: result.completedAt,
  });
  while (history.length > DEFAULT_MAX_INTERACTION_PROOF_HISTORY) {
    history.shift();
  }
}

export function getInteractionProofHistorySize(): number {
  return history.length;
}
