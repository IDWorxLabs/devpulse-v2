/**
 * Phase 26.91 — Authority evidence source realignment history (V1).
 */

import type { AuthorityEvidenceSourceRealignmentReport } from './authority-evidence-source-realignment-types.js';

const history: AuthorityEvidenceSourceRealignmentReport[] = [];
const MAX_HISTORY = 32;

export function recordAuthorityEvidenceSourceRealignment(
  report: AuthorityEvidenceSourceRealignmentReport,
): void {
  history.unshift(report);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getAuthorityEvidenceSourceRealignmentHistory(): readonly AuthorityEvidenceSourceRealignmentReport[] {
  return history;
}

export function getLatestAuthorityEvidenceSourceRealignment():
  | AuthorityEvidenceSourceRealignmentReport
  | null {
  return history[0] ?? null;
}

export function resetAuthorityEvidenceSourceRealignmentHistoryForTests(): void {
  history.length = 0;
}
