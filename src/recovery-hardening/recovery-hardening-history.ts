/**
 * Recovery Hardening — bounded history.
 */

import type { RecoveryHardeningHistoryEntry, RecoveryHardeningRecord } from './recovery-hardening-types.js';
import { DEFAULT_MAX_RECOVERY_HARDENING_HISTORY_SIZE } from './recovery-hardening-types.js';

const history: RecoveryHardeningHistoryEntry[] = [];

export function recordRecoveryHardeningHistory(record: RecoveryHardeningRecord): void {
  history.push({
    recoveryId: record.recoveryId,
    recoveryScore: record.recoveryScore,
    state: record.state,
    riskLevel: record.riskLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_RECOVERY_HARDENING_HISTORY_SIZE) {
    history.shift();
  }
}

export function getRecoveryHardeningHistory(): readonly RecoveryHardeningHistoryEntry[] {
  return [...history];
}

export function getRecoveryHardeningHistorySize(): number {
  return history.length;
}

export function clearRecoveryHardeningHistory(): void {
  history.length = 0;
}

export function resetRecoveryHardeningHistoryForTests(): void {
  clearRecoveryHardeningHistory();
}
