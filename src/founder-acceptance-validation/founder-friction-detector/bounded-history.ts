/**
 * Founder Friction Detector — bounded evaluation history.
 */

import type { FounderFrictionRecord } from './founder-friction-types.js';
import { DEFAULT_MAX_FOUNDER_FRICTION_HISTORY_SIZE } from './founder-friction-types.js';

interface HistoryEntry {
  founderFrictionId: string;
  overallScore: number;
  founderFrictionResult: FounderFrictionRecord['founderFrictionResult'];
  recordedAt: number;
}

const history: HistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_FOUNDER_FRICTION_HISTORY_SIZE;

export function recordFounderFrictionHistory(record: FounderFrictionRecord): void {
  history.push({
    founderFrictionId: record.founderFrictionId,
    overallScore: record.overallScore,
    founderFrictionResult: record.founderFrictionResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getFounderFrictionHistory(): readonly HistoryEntry[] {
  return [...history];
}

export function getFounderFrictionHistorySize(): number {
  return history.length;
}

export function clearFounderFrictionHistory(): void {
  history.length = 0;
}

export function resetFounderFrictionHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_FOUNDER_FRICTION_HISTORY_SIZE;
}
