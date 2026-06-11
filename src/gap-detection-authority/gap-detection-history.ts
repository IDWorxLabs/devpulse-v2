/**
 * Gap Detection Authority History — bounded assessment retention.
 */

import { MAX_GAP_HISTORY } from './gap-detection-bounds.js';
import type { GapDetectionAssessment } from './gap-detection-types.js';

const history: GapDetectionAssessment[] = [];

export function resetGapDetectionHistoryForTests(): void {
  history.length = 0;
}

export function recordGapDetectionAssessment(assessment: GapDetectionAssessment): void {
  history.push(assessment);
  while (history.length > MAX_GAP_HISTORY) {
    history.shift();
  }
}

export function getGapDetectionHistorySize(): number {
  return history.length;
}

export function getLatestGapDetectionAssessment(): GapDetectionAssessment | null {
  return history.at(-1) ?? null;
}
