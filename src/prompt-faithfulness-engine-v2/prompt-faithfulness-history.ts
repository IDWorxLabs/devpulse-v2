/**
 * Prompt Faithfulness Engine V2 — history store.
 */

import type { PromptFaithfulnessHistoryEntry, PromptFaithfulnessV2Result } from './prompt-faithfulness-v2-types.js';
import { DEFAULT_MAX_FAITHFULNESS_HISTORY } from './prompt-faithfulness-registry.js';

const history: PromptFaithfulnessHistoryEntry[] = [];
let historyCounter = 0;

export function resetPromptFaithfulnessHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}

export function recordPromptFaithfulnessHistory(result: PromptFaithfulnessV2Result): PromptFaithfulnessHistoryEntry {
  historyCounter += 1;
  const entry: PromptFaithfulnessHistoryEntry = {
    readOnly: true,
    historyId: `pfh-${historyCounter}`,
    resultId: result.resultId,
    promptHash: result.contract.promptHash,
    overallScore: result.faithfulnessScore.overallScore,
    readyForGeneration: result.readyForGeneration,
    conflictCount: result.conflicts.length,
    recordedAt: Date.now(),
  };
  history.unshift(entry);
  if (history.length > DEFAULT_MAX_FAITHFULNESS_HISTORY) {
    history.length = DEFAULT_MAX_FAITHFULNESS_HISTORY;
  }
  return entry;
}

export function getPromptFaithfulnessHistory(): readonly PromptFaithfulnessHistoryEntry[] {
  return [...history];
}

export function getPromptFaithfulnessHistorySize(): number {
  return history.length;
}
