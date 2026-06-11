/**
 * Live Preview Reality — bounded assessment history.
 */

import { MAX_HISTORY_ENTRIES } from './live-preview-reality-bounds.js';

export interface LivePreviewHistoryEntry {
  historyId: string;
  assessmentId: string;
  livePreviewRealityScore: number;
  summary: string;
  recordedAt: number;
}

const history: LivePreviewHistoryEntry[] = [];
let historyCounter = 0;

export function resetLivePreviewRealityHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}

function nextHistoryId(): string {
  historyCounter += 1;
  return `preview-history-${historyCounter}`;
}

export function recordLivePreviewHistory(
  entry: Omit<LivePreviewHistoryEntry, 'historyId' | 'recordedAt'>,
): LivePreviewHistoryEntry {
  const record: LivePreviewHistoryEntry = {
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

export function getLivePreviewHistoryCount(): number {
  return history.length;
}

export function listLivePreviewHistory(): LivePreviewHistoryEntry[] {
  return [...history];
}
