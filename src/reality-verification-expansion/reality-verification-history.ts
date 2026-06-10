/**
 * Reality Verification Expansion — bounded history.
 */

import type { RealityVerificationHistoryEntry, RealityVerificationRecord } from './reality-verification-types.js';
import { DEFAULT_MAX_REALITY_VERIFICATION_HISTORY_SIZE } from './reality-verification-types.js';

const history: RealityVerificationHistoryEntry[] = [];

export function recordRealityVerificationHistory(record: RealityVerificationRecord): void {
  history.push({
    recordId: record.recordId,
    overallRealityState: record.authority.overallRealityState,
    claimCount: record.authority.claimCount,
    consistencyScore: record.authority.consistency.consistencyScore,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_REALITY_VERIFICATION_HISTORY_SIZE) {
    history.shift();
  }
}

export function getRealityVerificationHistory(): readonly RealityVerificationHistoryEntry[] {
  return [...history];
}

export function getRealityVerificationHistorySize(): number {
  return history.length;
}

export function clearRealityVerificationHistory(): void {
  history.length = 0;
}

export function resetRealityVerificationHistoryForTests(): void {
  clearRealityVerificationHistory();
}
