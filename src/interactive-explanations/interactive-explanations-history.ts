/**
 * Interactive Explanations — bounded history.
 */

import type {
  InteractiveExplanationRecord,
  InteractiveExplanationsHistoryEntry,
} from './interactive-explanations-types.js';
import { DEFAULT_MAX_INTERACTIVE_EXPLANATIONS_HISTORY_SIZE } from './interactive-explanations-types.js';

const history: InteractiveExplanationsHistoryEntry[] = [];

export function recordInteractiveExplanationsHistory(record: InteractiveExplanationRecord): void {
  history.push({
    explanationId: record.explanationId,
    explanationCoverageScore: record.explanationCoverageScore,
    state: record.state,
    coverageLevel: record.coverageLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_INTERACTIVE_EXPLANATIONS_HISTORY_SIZE) {
    history.shift();
  }
}

export function getInteractiveExplanationsHistory(): readonly InteractiveExplanationsHistoryEntry[] {
  return [...history];
}

export function getInteractiveExplanationsHistorySize(): number {
  return history.length;
}

export function clearInteractiveExplanationsHistory(): void {
  history.length = 0;
}

export function resetInteractiveExplanationsHistoryForTests(): void {
  clearInteractiveExplanationsHistory();
}
