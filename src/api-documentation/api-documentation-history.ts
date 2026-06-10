/**
 * API Documentation — bounded history.
 */

import type {
  ApiDocumentationHistoryEntry,
  ApiDocumentationRecord,
} from './api-documentation-types.js';
import { DEFAULT_MAX_API_DOCUMENTATION_HISTORY_SIZE } from './api-documentation-types.js';

const history: ApiDocumentationHistoryEntry[] = [];

export function recordApiDocumentationHistory(record: ApiDocumentationRecord): void {
  history.push({
    documentationId: record.documentationId,
    apiCoverageScore: record.apiCoverageScore,
    state: record.state,
    coverageLevel: record.coverageLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_API_DOCUMENTATION_HISTORY_SIZE) {
    history.shift();
  }
}

export function getApiDocumentationHistory(): readonly ApiDocumentationHistoryEntry[] {
  return [...history];
}

export function getApiDocumentationHistorySize(): number {
  return history.length;
}

export function clearApiDocumentationHistory(): void {
  history.length = 0;
}

export function resetApiDocumentationHistoryForTests(): void {
  clearApiDocumentationHistory();
}
