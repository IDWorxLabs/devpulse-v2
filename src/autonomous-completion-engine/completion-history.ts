/**
 * Autonomous Completion Engine — bounded completion history.
 */

import type {
  CompletionDecision,
  CompletionHistoryEntry,
  CompletionReadiness,
  CompletionResult,
} from './autonomous-completion-engine-types.js';
import { MAX_COMPLETION_HISTORY_SIZE } from './autonomous-completion-engine-types.js';

const history: CompletionHistoryEntry[] = [];
let historyCounter = 0;

export function recordCompletionHistory(result: CompletionResult): CompletionHistoryEntry {
  historyCounter += 1;

  const entry: CompletionHistoryEntry = {
    historyId: `completion-history-${historyCounter}`,
    resultId: result.id,
    decision: result.decision,
    readiness: result.readiness,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > MAX_COMPLETION_HISTORY_SIZE) {
    history.length = MAX_COMPLETION_HISTORY_SIZE;
  }

  return entry;
}

export function getLatestCompletionDecisions(limit = 10): CompletionHistoryEntry[] {
  return history.slice(0, limit);
}

export function lookupCompletionHistoryByDecision(decision: CompletionDecision): CompletionHistoryEntry[] {
  return history.filter((e) => e.decision === decision);
}

export function lookupCompletionHistoryByReadiness(readiness: CompletionReadiness): CompletionHistoryEntry[] {
  return history.filter((e) => e.readiness === readiness);
}

export function getCompletionHistorySize(): number {
  return history.length;
}

export function resetCompletionHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
