/**
 * Self Documentation — bounded history.
 */

import type { SelfDocumentationHistoryEntry, SelfDocumentationRecord } from './self-documentation-types.js';
import { DEFAULT_MAX_SELF_DOCUMENTATION_HISTORY_SIZE } from './self-documentation-types.js';

const history: SelfDocumentationHistoryEntry[] = [];

export function recordSelfDocumentationHistory(record: SelfDocumentationRecord): void {
  history.push({
    documentationId: record.documentationId,
    documentationCoverageScore: record.documentationCoverageScore,
    state: record.state,
    completenessLevel: record.completenessLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_SELF_DOCUMENTATION_HISTORY_SIZE) {
    history.shift();
  }
}

export function getSelfDocumentationHistory(): readonly SelfDocumentationHistoryEntry[] {
  return [...history];
}

export function getSelfDocumentationHistorySize(): number {
  return history.length;
}

export function clearSelfDocumentationHistory(): void {
  history.length = 0;
}

export function resetSelfDocumentationHistoryForTests(): void {
  clearSelfDocumentationHistory();
}
