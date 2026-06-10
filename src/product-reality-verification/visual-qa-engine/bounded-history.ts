/**
 * Visual QA Engine — bounded evaluation history.
 */

import type { VisualQAHistoryEntry, VisualQARecord } from './visual-qa-types.js';
import { DEFAULT_MAX_VISUAL_QA_HISTORY_SIZE } from './visual-qa-types.js';

const history: VisualQAHistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_VISUAL_QA_HISTORY_SIZE;

export function recordVisualQAHistory(record: VisualQARecord): void {
  history.push({
    visualQaId: record.visualQaId,
    overallScore: record.overallScore,
    visualQaResult: record.visualQaResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getVisualQAHistory(): readonly VisualQAHistoryEntry[] {
  return [...history];
}

export function getVisualQAHistorySize(): number {
  return history.length;
}

export function clearVisualQAHistory(): void {
  history.length = 0;
}

export function resetVisualQAHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_VISUAL_QA_HISTORY_SIZE;
}
