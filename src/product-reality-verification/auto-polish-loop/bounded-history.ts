/**
 * Auto-Polish Loop — bounded evaluation history.
 */

import type { AutoPolishHistoryEntry, AutoPolishRecord } from './auto-polish-types.js';
import { DEFAULT_MAX_AUTO_POLISH_HISTORY_SIZE } from './auto-polish-types.js';

const history: AutoPolishHistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_AUTO_POLISH_HISTORY_SIZE;

export function recordAutoPolishHistory(record: AutoPolishRecord): void {
  history.push({
    autoPolishId: record.autoPolishId,
    overallScore: record.overallScore,
    autoPolishResult: record.autoPolishResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getAutoPolishHistory(): readonly AutoPolishHistoryEntry[] {
  return [...history];
}

export function getAutoPolishHistorySize(): number {
  return history.length;
}

export function clearAutoPolishHistory(): void {
  history.length = 0;
}

export function resetAutoPolishHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_AUTO_POLISH_HISTORY_SIZE;
}
