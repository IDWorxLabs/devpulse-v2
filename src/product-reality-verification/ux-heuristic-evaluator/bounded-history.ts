/**
 * UX Heuristic Evaluator — bounded evaluation history.
 */

import type { UXHeuristicHistoryEntry, UXHeuristicRecord } from './ux-heuristic-types.js';
import { DEFAULT_MAX_UX_HEURISTIC_HISTORY_SIZE } from './ux-heuristic-types.js';

const history: UXHeuristicHistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_UX_HEURISTIC_HISTORY_SIZE;

export function recordUXHeuristicHistory(record: UXHeuristicRecord): void {
  history.push({
    uxHeuristicId: record.uxHeuristicId,
    overallScore: record.overallScore,
    uxHeuristicResult: record.uxHeuristicResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getUXHeuristicHistory(): readonly UXHeuristicHistoryEntry[] {
  return [...history];
}

export function getUXHeuristicHistorySize(): number {
  return history.length;
}

export function clearUXHeuristicHistory(): void {
  history.length = 0;
}

export function resetUXHeuristicHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_UX_HEURISTIC_HISTORY_SIZE;
}
