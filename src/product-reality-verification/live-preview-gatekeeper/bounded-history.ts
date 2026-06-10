/**
 * Live Preview Gatekeeper — bounded evaluation history.
 */

import type { LivePreviewHistoryEntry, LivePreviewRecord } from './live-preview-types.js';
import { DEFAULT_MAX_LIVE_PREVIEW_HISTORY_SIZE } from './live-preview-types.js';

const history: LivePreviewHistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_LIVE_PREVIEW_HISTORY_SIZE;

export function recordLivePreviewHistory(record: LivePreviewRecord): void {
  history.push({
    livePreviewId: record.livePreviewId,
    overallScore: record.overallScore,
    livePreviewResult: record.livePreviewResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getLivePreviewHistory(): readonly LivePreviewHistoryEntry[] {
  return [...history];
}

export function getLivePreviewHistorySize(): number {
  return history.length;
}

export function clearLivePreviewHistory(): void {
  history.length = 0;
}

export function resetLivePreviewHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_LIVE_PREVIEW_HISTORY_SIZE;
}
