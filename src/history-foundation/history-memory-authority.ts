/**
 * Phase 26.3 — History foundation authority (read-only).
 */

import { buildHistoryMemorySummary, serializeHistoryForLlm } from './history-memory-builder.js';
import type { HistoryFoundationSnapshot, HistoryMemorySummary } from './history-memory-types.js';

export function getHistoryMemorySummary(query = 'default'): HistoryMemorySummary {
  return buildHistoryMemorySummary(query);
}

export function loadHistoryFoundation(query = 'default'): HistoryFoundationSnapshot {
  return {
    readOnly: true,
    summary: getHistoryMemorySummary(query),
    loadedAt: Date.now(),
  };
}

export { serializeHistoryForLlm };
