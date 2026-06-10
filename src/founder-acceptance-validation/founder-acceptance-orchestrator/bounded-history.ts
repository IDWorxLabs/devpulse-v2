/**
 * Founder Acceptance Orchestrator — bounded evaluation history.
 */

import type { FounderAcceptanceRecord } from './founder-acceptance-orchestrator-types.js';
import { DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE } from './founder-acceptance-orchestrator-types.js';

interface HistoryEntry {
  founderAcceptanceId: string;
  overallScore: number;
  founderAcceptanceResult: FounderAcceptanceRecord['founderAcceptanceResult'];
  founderAcceptanceVerdict: FounderAcceptanceRecord['founderAcceptanceVerdict'];
  recordedAt: number;
}

const history: HistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE;

export function recordFounderAcceptanceHistory(record: FounderAcceptanceRecord): void {
  history.push({
    founderAcceptanceId: record.founderAcceptanceId,
    overallScore: record.overallScore,
    founderAcceptanceResult: record.founderAcceptanceResult,
    founderAcceptanceVerdict: record.founderAcceptanceVerdict,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getFounderAcceptanceHistory(): readonly HistoryEntry[] {
  return [...history];
}

export function getFounderAcceptanceHistorySize(): number {
  return history.length;
}

export function clearFounderAcceptanceHistory(): void {
  history.length = 0;
}

export function resetFounderAcceptanceHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE;
}
