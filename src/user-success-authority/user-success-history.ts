/**
 * User Success Authority History — bounded assessment retention.
 */

import { MAX_USER_SUCCESS_HISTORY } from './user-success-bounds.js';
import type { UserSuccessAssessment } from './user-success-types.js';

const history: UserSuccessAssessment[] = [];

export function resetUserSuccessHistoryForTests(): void {
  history.length = 0;
}

export function recordUserSuccessAssessment(assessment: UserSuccessAssessment): void {
  history.push(assessment);
  while (history.length > MAX_USER_SUCCESS_HISTORY) {
    history.shift();
  }
}

export function getUserSuccessHistorySize(): number {
  return history.length;
}

export function getLatestUserSuccessAssessment(): UserSuccessAssessment | null {
  return history.at(-1) ?? null;
}
