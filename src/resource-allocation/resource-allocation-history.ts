/**
 * Resource Allocation — bounded allocation history.
 */

import type { AllocationHistoryEntry, ResourceType } from './resource-allocation-types.js';
import { DEFAULT_MAX_ALLOCATION_HISTORY_SIZE } from './resource-allocation-types.js';

const history: AllocationHistoryEntry[] = [];
let historyCounter = 0;
let maxHistorySize = DEFAULT_MAX_ALLOCATION_HISTORY_SIZE;

export function setMaxAllocationHistorySize(size: number): void {
  maxHistorySize = size;
}

export function recordAllocationHistory(
  projectId: string,
  resourceType: ResourceType,
  eventType: AllocationHistoryEntry['eventType'],
  detail: string,
): AllocationHistoryEntry {
  historyCounter += 1;

  const entry: AllocationHistoryEntry = {
    historyId: `allocation-history-${historyCounter}`,
    projectId,
    resourceType,
    eventType,
    detail,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > maxHistorySize) {
    history.length = maxHistorySize;
  }

  return entry;
}

export function getAllocationHistory(limit = 20): AllocationHistoryEntry[] {
  return history.slice(0, limit);
}

export function getAllocationHistorySize(): number {
  return history.length;
}

export function resetAllocationHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
  maxHistorySize = DEFAULT_MAX_ALLOCATION_HISTORY_SIZE;
}
