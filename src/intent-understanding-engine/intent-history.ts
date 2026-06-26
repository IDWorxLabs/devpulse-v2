/**
 * Intent Understanding Engine — understanding history store.
 */

import type { IntentHistoryEntry, IntentUnderstandingResult } from './intent-understanding-types.js';
import { DEFAULT_MAX_INTENT_HISTORY_SIZE } from './intent-understanding-types.js';

const history: IntentHistoryEntry[] = [];
let historyCounter = 0;

export function resetIntentHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}

export function recordIntentUnderstandingHistory(result: IntentUnderstandingResult): IntentHistoryEntry {
  historyCounter += 1;
  const entry: IntentHistoryEntry = {
    readOnly: true,
    historyId: `intent-history-${historyCounter}`,
    understandingId: result.understandingId,
    productName: result.productIntelligenceModel.product.productName,
    productType: result.productIntelligenceModel.product.productType,
    overallConfidence: result.productIntelligenceModel.confidence.overallConfidence,
    readyForGeneration: result.readyForGeneration,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > DEFAULT_MAX_INTENT_HISTORY_SIZE) {
    history.length = DEFAULT_MAX_INTENT_HISTORY_SIZE;
  }

  return entry;
}

export function getIntentHistory(): readonly IntentHistoryEntry[] {
  return [...history];
}

export function getIntentHistorySize(): number {
  return history.length;
}

export function getLastIntentHistoryEntry(): IntentHistoryEntry | null {
  return history[0] ?? null;
}
