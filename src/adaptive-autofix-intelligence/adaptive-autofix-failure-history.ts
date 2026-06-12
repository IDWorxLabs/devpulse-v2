/**
 * Adaptive AutoFix Intelligence — bounded failure history.
 */

import { MAX_ADAPTIVE_AUTOFIX_HISTORY } from './adaptive-autofix-bounds.js';
import type { FailureRecord } from './adaptive-autofix-types.js';

const history: FailureRecord[] = [];

export function resetAdaptiveAutofixHistoryForTests(): void {
  history.length = 0;
}

export function recordAdaptiveAutofixFailures(records: readonly FailureRecord[]): void {
  for (const record of records) {
    history.push({ ...record, attemptedFixes: [...record.attemptedFixes] });
  }
  while (history.length > MAX_ADAPTIVE_AUTOFIX_HISTORY) {
    history.shift();
  }
}

export function getAdaptiveAutofixHistorySize(): number {
  return history.length;
}

export function getLatestAdaptiveAutofixFailures(): FailureRecord[] {
  return history.map((record) => ({ ...record, attemptedFixes: [...record.attemptedFixes] }));
}

export function countRepeatedCategoryFailures(category: FailureRecord['failureCategory']): number {
  return history.filter((record) => record.failureCategory === category).length;
}
