/**
 * Completion runtime diagnostics.
 */

import type { CompletionDiagnostics, CompletionReport } from './types.js';

let diagnostics: CompletionDiagnostics = {
  completionRuntimeActive: false,
  completionPlanCount: 0,
  blockedCompletionCount: 0,
  readyForFutureCompletionCount: 0,
  verificationRequiredCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getCompletionDiagnostics(): CompletionDiagnostics {
  return { ...diagnostics };
}

export function updateCompletionDiagnostics(query: string, report: CompletionReport): void {
  diagnostics = {
    completionRuntimeActive: true,
    completionPlanCount: diagnostics.completionPlanCount + 1,
    blockedCompletionCount: diagnostics.blockedCompletionCount + (report.state === 'BLOCKED' ? 1 : 0),
    readyForFutureCompletionCount:
      diagnostics.readyForFutureCompletionCount +
      (report.state === 'READY_FOR_FUTURE_COMPLETION' ? 1 : 0),
    verificationRequiredCount:
      diagnostics.verificationRequiredCount + (report.state === 'VERIFICATION_REQUIRED' ? 1 : 0),
    lastQuery: query,
    lastState: report.state,
  };
}

export function resetCompletionDiagnostics(): void {
  diagnostics = {
    completionRuntimeActive: false,
    completionPlanCount: 0,
    blockedCompletionCount: 0,
    readyForFutureCompletionCount: 0,
    verificationRequiredCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function completionKey(): string {
  const d = diagnostics;
  return [
    String(d.completionRuntimeActive),
    String(d.completionPlanCount),
    String(d.blockedCompletionCount),
    String(d.readyForFutureCompletionCount),
    String(d.verificationRequiredCount),
    d.lastQuery ?? '',
    d.lastState ?? '',
  ].join('|');
}
