/**
 * Live Preview Gate — history.
 */

import type { LivePreviewGateResult } from './live-preview-gate-types.js';
import { DEFAULT_MAX_LIVE_PREVIEW_GATE_HISTORY } from './live-preview-gate-types.js';

const history: LivePreviewGateResult[] = [];

export function recordLivePreviewGateEvaluation(result: LivePreviewGateResult): void {
  history.unshift(result);
  if (history.length > DEFAULT_MAX_LIVE_PREVIEW_GATE_HISTORY) {
    history.length = DEFAULT_MAX_LIVE_PREVIEW_GATE_HISTORY;
  }
}

export function getLivePreviewGateHistory(): readonly LivePreviewGateResult[] {
  return history;
}

export function getLatestLivePreviewGateResult(): LivePreviewGateResult | null {
  return history[0] ?? null;
}

export function resetLivePreviewGateHistoryForTests(): void {
  history.length = 0;
}
