/**
 * Unknown Discovery Authority History — bounded assessment retention.
 */

import { MAX_UNKNOWN_HISTORY } from './unknown-discovery-bounds.js';
import type { UnknownDiscoveryAssessment } from './unknown-discovery-types.js';

const history: UnknownDiscoveryAssessment[] = [];

export function resetUnknownDiscoveryHistoryForTests(): void {
  history.length = 0;
}

export function recordUnknownDiscoveryAssessment(assessment: UnknownDiscoveryAssessment): void {
  history.push(assessment);
  while (history.length > MAX_UNKNOWN_HISTORY) {
    history.shift();
  }
}

export function getUnknownDiscoveryHistorySize(): number {
  return history.length;
}

export function getLatestUnknownDiscoveryAssessment(): UnknownDiscoveryAssessment | null {
  return history.at(-1) ?? null;
}
