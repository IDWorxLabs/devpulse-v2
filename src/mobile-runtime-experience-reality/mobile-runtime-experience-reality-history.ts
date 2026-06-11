/**
 * Mobile Runtime Experience Reality — bounded history.
 */

import { MAX_HISTORY_ENTRIES } from './mobile-runtime-experience-reality-bounds.js';

export interface MobileRuntimeHistoryEntry {
  assessmentId: string;
  mobileRuntimeExperienceScore: number;
  summary: string;
  recordedAt: number;
}

const history: MobileRuntimeHistoryEntry[] = [];

export function resetMobileRuntimeExperienceHistoryForTests(): void {
  history.length = 0;
}

export function recordMobileRuntimeHistory(entry: MobileRuntimeHistoryEntry): void {
  history.unshift(entry);
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.length = MAX_HISTORY_ENTRIES;
  }
}

export function getMobileRuntimeHistoryCount(): number {
  return history.length;
}

export function listMobileRuntimeHistory(): MobileRuntimeHistoryEntry[] {
  return [...history];
}
