/**
 * Multi Project Foundation — bounded project history.
 */

import type { ProjectEventType, ProjectHistoryEntry } from './multi-project-types.js';
import { DEFAULT_MAX_PROJECT_HISTORY_SIZE } from './multi-project-types.js';

const historyByProject = new Map<string, ProjectHistoryEntry[]>();
let historyCounter = 0;
let maxHistorySize = DEFAULT_MAX_PROJECT_HISTORY_SIZE;

export function setMaxProjectHistorySize(size: number): void {
  maxHistorySize = size;
}

export function getMaxProjectHistorySize(): number {
  return maxHistorySize;
}

export function recordProjectEvent(
  projectId: string,
  eventType: ProjectEventType,
  detail: string,
): ProjectHistoryEntry {
  historyCounter += 1;

  const entry: ProjectHistoryEntry = {
    historyId: `project-history-${historyCounter}`,
    projectId,
    eventType,
    detail,
    recordedAt: Date.now(),
  };

  const projectHistory = historyByProject.get(projectId) ?? [];
  projectHistory.unshift(entry);
  if (projectHistory.length > maxHistorySize) {
    projectHistory.length = maxHistorySize;
  }
  historyByProject.set(projectId, projectHistory);

  return entry;
}

export function getProjectHistory(projectId: string, limit = 10): ProjectHistoryEntry[] {
  return (historyByProject.get(projectId) ?? []).slice(0, limit);
}

export function getTotalProjectHistorySize(): number {
  let total = 0;
  for (const entries of historyByProject.values()) {
    total += entries.length;
  }
  return total;
}

export function resetProjectHistoryForTests(): void {
  historyByProject.clear();
  historyCounter = 0;
  maxHistorySize = DEFAULT_MAX_PROJECT_HISTORY_SIZE;
}
