/**
 * Phase 26.3 — Bounded history memory types (summaries, not raw logs).
 */

export const HISTORY_FOUNDATION_VERSION = '26.3.0';

export interface HistoryMemoryEntry {
  readOnly: true;
  id: string;
  category:
    | 'MILESTONE'
    | 'BREAKTHROUGH'
    | 'FIX'
    | 'REGRESSION'
    | 'BLOCKER'
    | 'CHECKPOINT';
  summary: string;
  proofLevel: 'PROVEN' | 'PARTIAL' | 'UNKNOWN';
  recordedAt?: number;
}

export interface HistoryMemorySummary {
  readOnly: true;
  version: string;
  recentMajorMilestones: HistoryMemoryEntry[];
  recentBreakthroughs: HistoryMemoryEntry[];
  recentFixes: HistoryMemoryEntry[];
  recentRegressions: HistoryMemoryEntry[];
  currentBlockers: HistoryMemoryEntry[];
  savedCheckpoints: HistoryMemoryEntry[];
  builtAt: number;
}

export interface HistoryFoundationSnapshot {
  readOnly: true;
  summary: HistoryMemorySummary;
  loadedAt: number;
}
