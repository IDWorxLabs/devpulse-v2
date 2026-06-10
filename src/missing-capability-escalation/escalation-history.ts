/**
 * Missing Capability Escalation — bounded history.
 */

import type { CapabilityEscalationRecord, EscalationHistoryEntry } from './escalation-types.js';
import { DEFAULT_MAX_ESCALATION_HISTORY_SIZE } from './escalation-types.js';

const history: EscalationHistoryEntry[] = [];
let historyCounter = 0;

export function recordEscalationHistory(record: CapabilityEscalationRecord): EscalationHistoryEntry {
  historyCounter += 1;

  const entry: EscalationHistoryEntry = {
    historyId: `escalation-history-${historyCounter}`,
    escalationId: record.escalationId,
    trigger: record.trigger,
    decision: record.decision,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > DEFAULT_MAX_ESCALATION_HISTORY_SIZE) {
    history.length = DEFAULT_MAX_ESCALATION_HISTORY_SIZE;
  }

  return entry;
}

export function getEscalationHistory(limit = 20): EscalationHistoryEntry[] {
  return history.slice(0, limit);
}

export function getEscalationHistorySize(): number {
  return history.length;
}

export function resetEscalationHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
