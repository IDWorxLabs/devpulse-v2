/**
 * Capability Research Engine — bounded history.
 */

import type { CapabilityResearchHistoryEntry, CapabilityResearchRecord } from './capability-research-types.js';
import { DEFAULT_MAX_RESEARCH_HISTORY_SIZE } from './capability-research-types.js';

const history: CapabilityResearchHistoryEntry[] = [];
let historyCounter = 0;

export function recordCapabilityResearchHistory(record: CapabilityResearchRecord): void {
  historyCounter += 1;
  const entry: CapabilityResearchHistoryEntry = {
    historyId: `research-history-${historyCounter}`,
    researchId: record.researchId,
    capabilityDomain: record.capabilityDomain,
    decision: record.decision,
    recordedAt: Date.now(),
  };
  history.push(entry);
  while (history.length > DEFAULT_MAX_RESEARCH_HISTORY_SIZE) {
    history.shift();
  }
}

export function getCapabilityResearchHistory(): CapabilityResearchHistoryEntry[] {
  return [...history];
}

export function getCapabilityResearchHistorySize(): number {
  return history.length;
}

export function resetCapabilityResearchHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
