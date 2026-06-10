/**
 * Reliability Hardening — bounded history.
 */

import type { ReliabilityHardeningHistoryEntry, ReliabilityHardeningRecord } from './reliability-hardening-types.js';
import { DEFAULT_MAX_RELIABILITY_HARDENING_HISTORY_SIZE } from './reliability-hardening-types.js';

const history: ReliabilityHardeningHistoryEntry[] = [];

export function recordReliabilityHardeningHistory(record: ReliabilityHardeningRecord): void {
  history.push({
    reliabilityId: record.reliabilityId,
    reliabilityScore: record.reliabilityScore,
    state: record.state,
    riskLevel: record.riskLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_RELIABILITY_HARDENING_HISTORY_SIZE) {
    history.shift();
  }
}

export function getReliabilityHardeningHistory(): readonly ReliabilityHardeningHistoryEntry[] {
  return [...history];
}

export function getReliabilityHardeningHistorySize(): number {
  return history.length;
}

export function clearReliabilityHardeningHistory(): void {
  history.length = 0;
}

export function resetReliabilityHardeningHistoryForTests(): void {
  clearReliabilityHardeningHistory();
}
