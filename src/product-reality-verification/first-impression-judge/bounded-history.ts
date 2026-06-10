/**
 * First-Impression Judge — bounded evaluation history.
 */

import type { FirstImpressionHistoryEntry, FirstImpressionRecord } from './first-impression-types.js';
import { DEFAULT_MAX_FIRST_IMPRESSION_HISTORY_SIZE } from './first-impression-types.js';

const history: FirstImpressionHistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_FIRST_IMPRESSION_HISTORY_SIZE;

export function recordFirstImpressionHistory(record: FirstImpressionRecord): void {
  history.push({
    firstImpressionId: record.firstImpressionId,
    overallScore: record.overallScore,
    firstImpressionResult: record.firstImpressionResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getFirstImpressionHistory(): readonly FirstImpressionHistoryEntry[] {
  return [...history];
}

export function getFirstImpressionHistorySize(): number {
  return history.length;
}

export function clearFirstImpressionHistory(): void {
  history.length = 0;
}

export function resetFirstImpressionHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_FIRST_IMPRESSION_HISTORY_SIZE;
}
