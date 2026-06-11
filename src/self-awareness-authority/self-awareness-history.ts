/**
 * Self-Awareness Authority History — bounded assessment retention.
 */

import { MAX_SELF_AWARENESS_HISTORY } from './self-awareness-bounds.js';
import type { SelfAwarenessAssessment } from './self-awareness-types.js';

const history: SelfAwarenessAssessment[] = [];

export function resetSelfAwarenessHistoryForTests(): void {
  history.length = 0;
}

export function recordSelfAwarenessAssessment(assessment: SelfAwarenessAssessment): void {
  history.push(assessment);
  while (history.length > MAX_SELF_AWARENESS_HISTORY) {
    history.shift();
  }
}

export function getSelfAwarenessHistorySize(): number {
  return history.length;
}

export function getLatestSelfAwarenessAssessment(): SelfAwarenessAssessment | null {
  return history.at(-1) ?? null;
}
