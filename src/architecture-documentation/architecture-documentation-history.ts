/**
 * Architecture Documentation — bounded history.
 */

import type {
  ArchitectureDocumentationHistoryEntry,
  ArchitectureDocumentationRecord,
} from './architecture-documentation-types.js';
import { DEFAULT_MAX_ARCHITECTURE_DOCUMENTATION_HISTORY_SIZE } from './architecture-documentation-types.js';

const history: ArchitectureDocumentationHistoryEntry[] = [];

export function recordArchitectureDocumentationHistory(
  record: ArchitectureDocumentationRecord,
): void {
  history.push({
    documentationId: record.documentationId,
    architectureCoverageScore: record.architectureCoverageScore,
    state: record.state,
    coverageLevel: record.coverageLevel,
    recordedAt: Date.now(),
  });

  while (history.length > DEFAULT_MAX_ARCHITECTURE_DOCUMENTATION_HISTORY_SIZE) {
    history.shift();
  }
}

export function getArchitectureDocumentationHistory(): readonly ArchitectureDocumentationHistoryEntry[] {
  return [...history];
}

export function getArchitectureDocumentationHistorySize(): number {
  return history.length;
}

export function clearArchitectureDocumentationHistory(): void {
  history.length = 0;
}

export function resetArchitectureDocumentationHistoryForTests(): void {
  clearArchitectureDocumentationHistory();
}
