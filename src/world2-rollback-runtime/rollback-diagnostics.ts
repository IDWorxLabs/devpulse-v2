/**
 * Rollback runtime diagnostics.
 */

import type { RollbackDiagnostics, RollbackReport } from './types.js';

let diagnostics: RollbackDiagnostics = {
  rollbackRuntimeActive: false,
  rollbackPlanCount: 0,
  blockedRollbackCount: 0,
  readyForFutureRollbackCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getRollbackDiagnostics(): RollbackDiagnostics {
  return { ...diagnostics };
}

export function updateRollbackDiagnostics(query: string, report: RollbackReport): void {
  diagnostics = {
    rollbackRuntimeActive: true,
    rollbackPlanCount: diagnostics.rollbackPlanCount + 1,
    blockedRollbackCount: diagnostics.blockedRollbackCount + (report.state === 'BLOCKED' ? 1 : 0),
    readyForFutureRollbackCount:
      diagnostics.readyForFutureRollbackCount +
      (report.state === 'READY_FOR_FUTURE_ROLLBACK' ? 1 : 0),
    lastQuery: query,
    lastState: report.state,
  };
}

export function resetRollbackDiagnostics(): void {
  diagnostics = {
    rollbackRuntimeActive: false,
    rollbackPlanCount: 0,
    blockedRollbackCount: 0,
    readyForFutureRollbackCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function rollbackKey(): string {
  const d = diagnostics;
  return [
    String(d.rollbackRuntimeActive),
    String(d.rollbackPlanCount),
    String(d.blockedRollbackCount),
    String(d.readyForFutureRollbackCount),
    d.lastQuery ?? '',
    d.lastState ?? '',
  ].join('|');
}
