/**
 * First-Time User Reality Authority History — bounded assessment retention.
 */

import { MAX_FIRST_TIME_USER_HISTORY } from './first-time-user-reality-bounds.js';
import type { FirstTimeUserRealityAssessment } from './first-time-user-reality-types.js';

const history: FirstTimeUserRealityAssessment[] = [];

export function resetFirstTimeUserRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordFirstTimeUserRealityAssessment(assessment: FirstTimeUserRealityAssessment): void {
  history.push(assessment);
  while (history.length > MAX_FIRST_TIME_USER_HISTORY) {
    history.shift();
  }
}

export function getFirstTimeUserRealityHistorySize(): number {
  return history.length;
}

export function getLatestFirstTimeUserRealityAssessment(): FirstTimeUserRealityAssessment | null {
  return history.at(-1) ?? null;
}
