/**
 * Performance Hardening — bounded history.
 */

import type { PerformanceHardeningHistoryEntry, PerformanceHardeningRecord } from './performance-hardening-types.js';
import { DEFAULT_MAX_PERFORMANCE_HARDENING_HISTORY_SIZE } from './performance-hardening-types.js';

const history: PerformanceHardeningHistoryEntry[] = [];

export function recordPerformanceHardeningHistory(record: PerformanceHardeningRecord): void {
  history.push({
    performanceId: record.performanceId,
    performanceScore: record.performanceScore,
    state: record.state,
    riskLevel: record.riskLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_PERFORMANCE_HARDENING_HISTORY_SIZE) {
    history.shift();
  }
}

export function getPerformanceHardeningHistory(): readonly PerformanceHardeningHistoryEntry[] {
  return [...history];
}

export function getPerformanceHardeningHistorySize(): number {
  return history.length;
}

export function clearPerformanceHardeningHistory(): void {
  history.length = 0;
}

export function resetPerformanceHardeningHistoryForTests(): void {
  clearPerformanceHardeningHistory();
}
