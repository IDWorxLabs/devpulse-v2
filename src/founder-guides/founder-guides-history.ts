/**
 * Founder Guides — bounded history.
 */

import type { FounderGuideRecord, FounderGuidesHistoryEntry } from './founder-guides-types.js';
import { DEFAULT_MAX_FOUNDER_GUIDES_HISTORY_SIZE } from './founder-guides-types.js';

const history: FounderGuidesHistoryEntry[] = [];

export function recordFounderGuidesHistory(record: FounderGuideRecord): void {
  history.push({
    guideId: record.guideId,
    founderCoverageScore: record.founderCoverageScore,
    state: record.state,
    completenessLevel: record.completenessLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_FOUNDER_GUIDES_HISTORY_SIZE) {
    history.shift();
  }
}

export function getFounderGuidesHistory(): readonly FounderGuidesHistoryEntry[] {
  return [...history];
}

export function getFounderGuidesHistorySize(): number {
  return history.length;
}

export function clearFounderGuidesHistory(): void {
  history.length = 0;
}

export function resetFounderGuidesHistoryForTests(): void {
  clearFounderGuidesHistory();
}
