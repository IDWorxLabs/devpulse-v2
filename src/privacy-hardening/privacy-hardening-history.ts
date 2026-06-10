/**
 * Privacy Hardening — bounded history.
 */

import type { PrivacyHardeningHistoryEntry, PrivacyHardeningRecord } from './privacy-hardening-types.js';
import { DEFAULT_MAX_PRIVACY_HARDENING_HISTORY_SIZE } from './privacy-hardening-types.js';

const history: PrivacyHardeningHistoryEntry[] = [];

export function recordPrivacyHardeningHistory(record: PrivacyHardeningRecord): void {
  history.push({
    privacyId: record.privacyId,
    privacyScore: record.privacyScore,
    state: record.state,
    riskLevel: record.riskLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_PRIVACY_HARDENING_HISTORY_SIZE) {
    history.shift();
  }
}

export function getPrivacyHardeningHistory(): readonly PrivacyHardeningHistoryEntry[] {
  return [...history];
}

export function getPrivacyHardeningHistorySize(): number {
  return history.length;
}

export function clearPrivacyHardeningHistory(): void {
  history.length = 0;
}

export function resetPrivacyHardeningHistoryForTests(): void {
  clearPrivacyHardeningHistory();
}
