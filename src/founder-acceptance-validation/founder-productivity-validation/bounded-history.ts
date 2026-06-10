/**
 * Founder Productivity Validation — bounded evaluation history.
 */

import type { FounderProductivityRecord } from './founder-productivity-types.js';
import { DEFAULT_MAX_FOUNDER_PRODUCTIVITY_HISTORY_SIZE } from './founder-productivity-types.js';

interface HistoryEntry {
  founderProductivityId: string;
  overallScore: number;
  founderProductivityResult: FounderProductivityRecord['founderProductivityResult'];
  recordedAt: number;
}

const history: HistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_FOUNDER_PRODUCTIVITY_HISTORY_SIZE;

export function recordFounderProductivityHistory(record: FounderProductivityRecord): void {
  history.push({
    founderProductivityId: record.founderProductivityId,
    overallScore: record.overallScore,
    founderProductivityResult: record.founderProductivityResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getFounderProductivityHistory(): readonly HistoryEntry[] {
  return [...history];
}

export function getFounderProductivityHistorySize(): number {
  return history.length;
}

export function clearFounderProductivityHistory(): void {
  history.length = 0;
}

export function resetFounderProductivityHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_FOUNDER_PRODUCTIVITY_HISTORY_SIZE;
}
