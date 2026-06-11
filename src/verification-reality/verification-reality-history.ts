/**
 * Verification Reality — bounded assessment history.
 */

import { MAX_HISTORY_ENTRIES } from './verification-reality-bounds.js';

export interface VerificationHistoryEntry {
  historyId: string;
  assessmentId: string;
  verificationRealityScore: number;
  summary: string;
  recordedAt: number;
}

const history: VerificationHistoryEntry[] = [];
let historyCounter = 0;

export function resetVerificationRealityHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}

function nextHistoryId(): string {
  historyCounter += 1;
  return `verification-history-${historyCounter}`;
}

export function recordVerificationHistory(
  entry: Omit<VerificationHistoryEntry, 'historyId' | 'recordedAt'>,
): VerificationHistoryEntry {
  const record: VerificationHistoryEntry = {
    ...entry,
    historyId: nextHistoryId(),
    recordedAt: Date.now(),
  };
  history.unshift(record);
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.length = MAX_HISTORY_ENTRIES;
  }
  return record;
}

export function getVerificationHistoryCount(): number {
  return history.length;
}

export function listVerificationHistory(): VerificationHistoryEntry[] {
  return [...history];
}
