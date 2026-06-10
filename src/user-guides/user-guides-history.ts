/**
 * User Guides — bounded history.
 */

import type { UserGuideRecord, UserGuidesHistoryEntry } from './user-guides-types.js';
import { DEFAULT_MAX_USER_GUIDES_HISTORY_SIZE } from './user-guides-types.js';

const history: UserGuidesHistoryEntry[] = [];

export function recordUserGuidesHistory(record: UserGuideRecord): void {
  history.push({
    guideId: record.guideId,
    userCoverageScore: record.userCoverageScore,
    state: record.state,
    completenessLevel: record.completenessLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_USER_GUIDES_HISTORY_SIZE) {
    history.shift();
  }
}

export function getUserGuidesHistory(): readonly UserGuidesHistoryEntry[] {
  return [...history];
}

export function getUserGuidesHistorySize(): number {
  return history.length;
}

export function clearUserGuidesHistory(): void {
  history.length = 0;
}

export function resetUserGuidesHistoryForTests(): void {
  clearUserGuidesHistory();
}
