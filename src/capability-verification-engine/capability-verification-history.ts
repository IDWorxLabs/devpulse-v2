/**
 * Capability Verification Engine — bounded history.
 */

import type {
  CapabilityReadinessEvaluation,
  CapabilityVerificationHistoryEntry,
  CapabilityVerificationRecord,
} from './capability-verification-types.js';
import { DEFAULT_MAX_VERIFICATION_HISTORY_SIZE } from './capability-verification-types.js';

const history: CapabilityVerificationHistoryEntry[] = [];
let historyCounter = 0;

export function recordCapabilityVerificationHistory(
  record: CapabilityVerificationRecord,
  readiness: CapabilityReadinessEvaluation,
): void {
  historyCounter += 1;
  const entry: CapabilityVerificationHistoryEntry = {
    historyId: `verification-history-${historyCounter}`,
    verificationId: record.verificationId,
    decision: record.decision,
    readiness: readiness.state,
    recordedAt: Date.now(),
  };
  history.push(entry);
  while (history.length > DEFAULT_MAX_VERIFICATION_HISTORY_SIZE) {
    history.shift();
  }
}

export function getCapabilityVerificationHistory(): CapabilityVerificationHistoryEntry[] {
  return [...history];
}

export function getCapabilityVerificationHistorySize(): number {
  return history.length;
}

export function resetCapabilityVerificationHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
