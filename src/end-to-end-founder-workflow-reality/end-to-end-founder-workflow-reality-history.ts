/**
 * End-to-End Founder Workflow Reality — bounded assessment history.
 */

import { MAX_HISTORY_ENTRIES } from './end-to-end-founder-workflow-reality-bounds.js';

export interface FounderWorkflowHistoryEntry {
  historyId: string;
  assessmentId: string;
  founderWorkflowRealityScore: number;
  summary: string;
  recordedAt: number;
}

const history: FounderWorkflowHistoryEntry[] = [];
let historyCounter = 0;

export function resetFounderWorkflowRealityHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}

function nextHistoryId(): string {
  historyCounter += 1;
  return `founder-workflow-history-${historyCounter}`;
}

export function recordFounderWorkflowHistory(
  entry: Omit<FounderWorkflowHistoryEntry, 'historyId' | 'recordedAt'>,
): FounderWorkflowHistoryEntry {
  const record: FounderWorkflowHistoryEntry = {
    ...entry,
    historyId: nextHistoryId(),
    recordedAt: Date.now(),
  };
  history.unshift(record);
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.length = MAX_HISTORY_ENTRIES;
  }
  return record;
}

export function getFounderWorkflowHistoryCount(): number {
  return history.length;
}

export function listFounderWorkflowHistory(): FounderWorkflowHistoryEntry[] {
  return [...history];
}
