/**
 * Learning Visibility diagnostics.
 */

import type { LearningRecord, LearningVisibilityDiagnostics } from './learning-visibility-types.js';

let diagnostics: LearningVisibilityDiagnostics = {
  learningVisibilityActive: false,
  learningCount: 0,
  patternCount: 0,
  recurringFailureCount: 0,
  recurringBlockerCount: 0,
  lastLearningQuery: null,
};

export function getLearningVisibilityDiagnostics(): LearningVisibilityDiagnostics {
  return { ...diagnostics };
}

export function updateLearningVisibilityDiagnostics(
  query: string,
  records: LearningRecord[],
  patternCount: number,
  recurringFailureCount: number,
  recurringBlockerCount: number,
): void {
  diagnostics = {
    learningVisibilityActive: true,
    learningCount: records.length,
    patternCount,
    recurringFailureCount,
    recurringBlockerCount,
    lastLearningQuery: query,
  };
}

export function resetLearningVisibilityDiagnostics(): void {
  diagnostics = {
    learningVisibilityActive: false,
    learningCount: 0,
    patternCount: 0,
    recurringFailureCount: 0,
    recurringBlockerCount: 0,
    lastLearningQuery: null,
  };
}

export function learningVisibilityKey(): string {
  const d = diagnostics;
  return [
    String(d.learningVisibilityActive),
    String(d.learningCount),
    String(d.patternCount),
    String(d.recurringFailureCount),
  ].join('|');
}
