/**
 * Scale Hardening — bounded history.
 */

import type { ScaleHardeningHistoryEntry, ScaleHardeningRecord } from './scale-hardening-types.js';
import { DEFAULT_MAX_SCALE_HARDENING_HISTORY_SIZE } from './scale-hardening-types.js';

const history: ScaleHardeningHistoryEntry[] = [];

export function recordScaleHardeningHistory(record: ScaleHardeningRecord): void {
  history.push({
    scaleId: record.scaleId,
    scaleScore: record.scaleScore,
    state: record.state,
    riskLevel: record.riskLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_SCALE_HARDENING_HISTORY_SIZE) {
    history.shift();
  }
}

export function getScaleHardeningHistory(): readonly ScaleHardeningHistoryEntry[] {
  return [...history];
}

export function getScaleHardeningHistorySize(): number {
  return history.length;
}

export function clearScaleHardeningHistory(): void {
  history.length = 0;
}

export function resetScaleHardeningHistoryForTests(): void {
  clearScaleHardeningHistory();
}
