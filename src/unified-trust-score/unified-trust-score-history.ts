/**
 * Unified Trust Score — bounded history.
 */

import type { UnifiedTrustScoreHistoryEntry, UnifiedTrustScoreRecord } from './unified-trust-score-types.js';
import { DEFAULT_MAX_UNIFIED_TRUST_SCORE_HISTORY_SIZE } from './unified-trust-score-types.js';

const history: UnifiedTrustScoreHistoryEntry[] = [];

export function recordUnifiedTrustScoreHistory(record: UnifiedTrustScoreRecord): void {
  history.push({
    scoreId: record.scoreId,
    trustScore: record.trustScore,
    trustLevel: record.trustLevel,
    decision: record.decision,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_UNIFIED_TRUST_SCORE_HISTORY_SIZE) {
    history.shift();
  }
}

export function getUnifiedTrustScoreHistory(): readonly UnifiedTrustScoreHistoryEntry[] {
  return [...history];
}

export function getUnifiedTrustScoreHistorySize(): number {
  return history.length;
}

export function clearUnifiedTrustScoreHistory(): void {
  history.length = 0;
}

export function resetUnifiedTrustScoreHistoryForTests(): void {
  clearUnifiedTrustScoreHistory();
}
