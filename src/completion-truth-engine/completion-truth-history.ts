/**
 * Completion Truth Engine — bounded history.
 */

import type { CompletionTruthHistoryEntry, CompletionTruthRecord } from './completion-truth-types.js';
import { DEFAULT_MAX_COMPLETION_TRUTH_HISTORY_SIZE } from './completion-truth-types.js';

const history: CompletionTruthHistoryEntry[] = [];

export function recordCompletionTruthHistory(record: CompletionTruthRecord): void {
  history.push({
    recordId: record.recordId,
    truthState: record.authority.truthState,
    decision: record.authority.decision,
    completionTruthScore: record.authority.completionTruthScore,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_COMPLETION_TRUTH_HISTORY_SIZE) {
    history.shift();
  }
}

export function getCompletionTruthHistory(): readonly CompletionTruthHistoryEntry[] {
  return [...history];
}

export function getCompletionTruthHistorySize(): number {
  return history.length;
}

export function clearCompletionTruthHistory(): void {
  history.length = 0;
}

export function resetCompletionTruthHistoryForTests(): void {
  clearCompletionTruthHistory();
}
