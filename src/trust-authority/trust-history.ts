/**
 * Trust Authority History — bounded assessment retention.
 */

import { MAX_TRUST_HISTORY } from './trust-authority-bounds.js';
import type { TrustAssessment } from './trust-authority-types.js';

const history: TrustAssessment[] = [];

export function resetTrustAuthorityHistoryForTests(): void {
  history.length = 0;
}

export function recordTrustAuthorityAssessment(assessment: TrustAssessment): void {
  history.push(assessment);
  while (history.length > MAX_TRUST_HISTORY) {
    history.shift();
  }
}

export function getTrustAuthorityHistorySize(): number {
  return history.length;
}

export function getLatestTrustAuthorityAssessment(): TrustAssessment | null {
  return history.at(-1) ?? null;
}
