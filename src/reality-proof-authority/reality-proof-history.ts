/**
 * Reality-Proof Authority History — bounded assessment retention.
 */

import { MAX_REALITY_PROOF_HISTORY } from './reality-proof-bounds.js';
import type { RealityProofAssessment } from './reality-proof-types.js';

const history: RealityProofAssessment[] = [];

export function resetRealityProofHistoryForTests(): void {
  history.length = 0;
}

export function recordRealityProofAssessment(assessment: RealityProofAssessment): void {
  history.push(assessment);
  while (history.length > MAX_REALITY_PROOF_HISTORY) {
    history.shift();
  }
}

export function getRealityProofHistorySize(): number {
  return history.length;
}

export function getLatestRealityProofAssessment(): RealityProofAssessment | null {
  return history.at(-1) ?? null;
}
