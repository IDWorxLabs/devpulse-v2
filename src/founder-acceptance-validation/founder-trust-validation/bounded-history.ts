/**
 * Founder Trust Validation — bounded evaluation history.
 */

import type { FounderTrustRecord } from './founder-trust-types.js';
import { DEFAULT_MAX_FOUNDER_TRUST_HISTORY_SIZE } from './founder-trust-types.js';

interface HistoryEntry {
  founderTrustId: string;
  overallScore: number;
  founderTrustResult: FounderTrustRecord['founderTrustResult'];
  recordedAt: number;
}

const history: HistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_FOUNDER_TRUST_HISTORY_SIZE;

export function recordFounderTrustHistory(record: FounderTrustRecord): void {
  history.push({
    founderTrustId: record.founderTrustId,
    overallScore: record.overallScore,
    founderTrustResult: record.founderTrustResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getFounderTrustHistory(): readonly HistoryEntry[] {
  return [...history];
}

export function getFounderTrustHistorySize(): number {
  return history.length;
}

export function clearFounderTrustHistory(): void {
  history.length = 0;
}

export function resetFounderTrustHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_FOUNDER_TRUST_HISTORY_SIZE;
}
