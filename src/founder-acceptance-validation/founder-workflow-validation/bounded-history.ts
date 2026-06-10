/**
 * Founder Workflow Validation — bounded evaluation history.
 */

import type { FounderWorkflowRecord } from './founder-workflow-types.js';
import { DEFAULT_MAX_FOUNDER_WORKFLOW_HISTORY_SIZE } from './founder-workflow-types.js';

interface HistoryEntry {
  founderWorkflowId: string;
  overallScore: number;
  founderWorkflowResult: FounderWorkflowRecord['founderWorkflowResult'];
  recordedAt: number;
}

const history: HistoryEntry[] = [];
let maxHistorySize = DEFAULT_MAX_FOUNDER_WORKFLOW_HISTORY_SIZE;

export function recordFounderWorkflowHistory(record: FounderWorkflowRecord): void {
  history.push({
    founderWorkflowId: record.founderWorkflowId,
    overallScore: record.overallScore,
    founderWorkflowResult: record.founderWorkflowResult,
    recordedAt: Date.now(),
  });
  while (history.length > maxHistorySize) {
    history.shift();
  }
}

export function getFounderWorkflowHistory(): readonly HistoryEntry[] {
  return [...history];
}

export function getFounderWorkflowHistorySize(): number {
  return history.length;
}

export function clearFounderWorkflowHistory(): void {
  history.length = 0;
}

export function resetFounderWorkflowHistoryForTests(): void {
  history.length = 0;
  maxHistorySize = DEFAULT_MAX_FOUNDER_WORKFLOW_HISTORY_SIZE;
}
