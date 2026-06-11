/**
 * Self-Evolution Authority History — bounded assessment retention.
 */

import { MAX_EVOLUTION_HISTORY } from './self-evolution-bounds.js';
import type { SelfEvolutionAssessment } from './self-evolution-types.js';

const history: SelfEvolutionAssessment[] = [];

export function resetSelfEvolutionHistoryForTests(): void {
  history.length = 0;
}

export function recordSelfEvolutionAssessment(assessment: SelfEvolutionAssessment): void {
  history.push(assessment);
  while (history.length > MAX_EVOLUTION_HISTORY) {
    history.shift();
  }
}

export function getSelfEvolutionHistorySize(): number {
  return history.length;
}

export function getLatestSelfEvolutionAssessment(): SelfEvolutionAssessment | null {
  return history.at(-1) ?? null;
}

export function categoryRepeatedInHistory(category: string): boolean {
  const latest = getLatestSelfEvolutionAssessment();
  if (!latest) return false;
  return latest.patterns.some((pattern) => pattern.category === category && pattern.repeatCount >= 2);
}
