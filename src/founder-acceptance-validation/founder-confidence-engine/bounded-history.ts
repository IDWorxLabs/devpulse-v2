/**
 * Founder Confidence Engine — bounded evaluation history.
 */

import type { FounderConfidenceRecord } from './founder-confidence-types.js';
import { DEFAULT_MAX_FOUNDER_CONFIDENCE_HISTORY_SIZE } from './founder-confidence-types.js';

interface HistoryEntry {
  founderConfidenceId: string;
  overallScore: number;
  founderConfidenceResult: FounderConfidenceRecord['founderConfidenceResult'];
  recordedAt: number;
}

const history: HistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_FOUNDER_CONFIDENCE_HISTORY_SIZE;

export function recordFounderConfidenceHistory(record: FounderConfidenceRecord): void {
  history.push({
    founderConfidenceId: record.founderConfidenceId,
    overallScore: record.overallScore,
    founderConfidenceResult: record.founderConfidenceResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getFounderConfidenceHistory(): readonly HistoryEntry[] {
  return [...history];
}

export function getFounderConfidenceHistorySize(): number {
  return history.length;
}

export function clearFounderConfidenceHistory(): void {
  history.length = 0;
}

export function resetFounderConfidenceHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_FOUNDER_CONFIDENCE_HISTORY_SIZE;
}
