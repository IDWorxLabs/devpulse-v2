/**
 * Skeptical Founder Simulator History — bounded assessment retention.
 */

import type { SkepticalFounderAssessment } from './skeptical-founder-types.js';
import { MAX_SKEPTICAL_HISTORY } from './skeptical-founder-bounds.js';

const history: SkepticalFounderAssessment[] = [];

export function resetSkepticalFounderHistoryForTests(): void {
  history.length = 0;
}

export function recordSkepticalFounderAssessment(assessment: SkepticalFounderAssessment): void {
  history.push(assessment);
  while (history.length > MAX_SKEPTICAL_HISTORY) {
    history.shift();
  }
}

export function getSkepticalFounderHistorySize(): number {
  return history.length;
}

export function getLatestSkepticalFounderAssessment(): SkepticalFounderAssessment | null {
  return history.at(-1) ?? null;
}
