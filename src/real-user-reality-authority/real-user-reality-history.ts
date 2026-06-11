/**
 * Real User Reality Authority History — bounded assessment retention.
 */

import { MAX_REAL_USER_HISTORY } from './real-user-reality-bounds.js';
import type { RealUserRealityAssessment } from './real-user-reality-types.js';

const history: RealUserRealityAssessment[] = [];

export function resetRealUserRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordRealUserRealityAssessment(assessment: RealUserRealityAssessment): void {
  history.push(assessment);
  while (history.length > MAX_REAL_USER_HISTORY) {
    history.shift();
  }
}

export function getRealUserRealityHistorySize(): number {
  return history.length;
}

export function getLatestRealUserRealityAssessment(): RealUserRealityAssessment | null {
  return history.at(-1) ?? null;
}
