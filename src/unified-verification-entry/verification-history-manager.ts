/**
 * Verification history manager — request, session, report, evidence history.
 */

import type {
  VerificationHistoryEntry,
  VerificationScopeType,
} from './unified-verification-types.js';

const history: VerificationHistoryEntry[] = [];
let historyCounter = 0;

export function resetVerificationEntryHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}

function nextHistoryId(): string {
  historyCounter += 1;
  return `uvehist-${historyCounter.toString().padStart(4, '0')}`;
}

export function recordVerificationHistory(opts: {
  requestId: string;
  sessionId: string;
  event: VerificationHistoryEntry['event'];
  consumer?: string;
  scopeType?: VerificationScopeType;
}): VerificationHistoryEntry {
  const entry: VerificationHistoryEntry = {
    entryId: nextHistoryId(),
    requestId: opts.requestId,
    sessionId: opts.sessionId,
    event: opts.event,
    consumer: opts.consumer,
    scopeType: opts.scopeType,
    timestamp: Date.now(),
  };
  history.push(entry);
  return entry;
}

export function getVerificationHistory(): VerificationHistoryEntry[] {
  return [...history];
}

export function listVerificationHistoryByRequest(requestId: string): VerificationHistoryEntry[] {
  return history.filter((h) => h.requestId === requestId);
}
