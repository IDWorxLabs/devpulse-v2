/**
 * Phase 26.93 — Authority Recursion Guard history (V1).
 */

import type { AuthorityRecursionGuardReport } from './authority-recursion-guard-types.js';

const MAX_HISTORY = 32;

export interface AuthorityRecursionGuardHistoryEntry {
  readOnly: true;
  guardId: string;
  generatedAt: string;
  detectionCount: number;
  passToken: string | null;
}

const history: AuthorityRecursionGuardHistoryEntry[] = [];

export function resetAuthorityRecursionGuardHistoryForTests(): void {
  history.length = 0;
}

export function recordAuthorityRecursionGuardReport(report: AuthorityRecursionGuardReport): void {
  history.unshift({
    readOnly: true,
    guardId: report.guardId,
    generatedAt: report.generatedAt,
    detectionCount: report.detections.length,
    passToken: report.passToken,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getAuthorityRecursionGuardHistorySize(): number {
  return history.length;
}

export function getAuthorityRecursionGuardHistory(): readonly AuthorityRecursionGuardHistoryEntry[] {
  return history;
}
