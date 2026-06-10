/**
 * Founder Readiness Authority — bounded evaluation history.
 */

import type { FounderReadinessRecord } from './founder-readiness-types.js';
import { DEFAULT_MAX_FOUNDER_READINESS_HISTORY_SIZE } from './founder-readiness-types.js';

interface HistoryEntry {
  founderReadinessId: string;
  overallScore: number;
  founderReadinessResult: FounderReadinessRecord['founderReadinessResult'];
  founderReadinessStatus: FounderReadinessRecord['founderReadinessStatus'];
  recordedAt: number;
}

const history: HistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_FOUNDER_READINESS_HISTORY_SIZE;

export function recordFounderReadinessHistory(record: FounderReadinessRecord): void {
  history.push({
    founderReadinessId: record.founderReadinessId,
    overallScore: record.overallScore,
    founderReadinessResult: record.founderReadinessResult,
    founderReadinessStatus: record.founderReadinessStatus,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getFounderReadinessHistory(): readonly HistoryEntry[] {
  return [...history];
}

export function getFounderReadinessHistorySize(): number {
  return history.length;
}

export function clearFounderReadinessHistory(): void {
  history.length = 0;
}

export function resetFounderReadinessHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_FOUNDER_READINESS_HISTORY_SIZE;
}
