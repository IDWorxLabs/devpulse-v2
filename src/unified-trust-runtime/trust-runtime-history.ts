/**
 * Unified Trust Runtime — bounded history.
 */

import type { TrustRuntimeHistoryEntry, TrustRuntimeRecord } from './trust-runtime-types.js';
import { DEFAULT_MAX_TRUST_RUNTIME_HISTORY_SIZE as MAX_HISTORY } from './trust-runtime-types.js';

const history: TrustRuntimeHistoryEntry[] = [];

export function recordTrustRuntimeHistory(record: TrustRuntimeRecord): void {
  history.push({
    recordId: record.recordId,
    trustState: record.authority.trustState,
    overallTrustLevel: record.authority.overallTrustLevel,
    signalCount: record.authority.signalCount,
    recordedAt: Date.now(),
  });

  while (history.length > MAX_HISTORY) {
    history.shift();
  }
}

export function getTrustRuntimeHistory(): readonly TrustRuntimeHistoryEntry[] {
  return [...history];
}

export function getTrustRuntimeHistorySize(): number {
  return history.length;
}

export function clearTrustRuntimeHistory(): void {
  history.length = 0;
}

export function resetTrustRuntimeHistoryForTests(): void {
  clearTrustRuntimeHistory();
}
