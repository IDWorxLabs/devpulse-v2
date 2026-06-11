/**
 * Competitive Reality Authority History — bounded assessment retention.
 */

import { MAX_COMPETITIVE_HISTORY } from './competitive-reality-bounds.js';
import type { CompetitiveRealityAssessment } from './competitive-reality-types.js';

const history: CompetitiveRealityAssessment[] = [];

export function resetCompetitiveRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordCompetitiveRealityAssessment(assessment: CompetitiveRealityAssessment): void {
  history.push(assessment);
  while (history.length > MAX_COMPETITIVE_HISTORY) {
    history.shift();
  }
}

export function getCompetitiveRealityHistorySize(): number {
  return history.length;
}

export function getLatestCompetitiveRealityAssessment(): CompetitiveRealityAssessment | null {
  return history.at(-1) ?? null;
}
