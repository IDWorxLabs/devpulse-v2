/**
 * Recovery runtime diagnostics.
 */

import type { RecoveryDiagnostics, RecoveryReport } from './types.js';

let diagnostics: RecoveryDiagnostics = {
  recoveryRuntimeActive: false,
  recoveryPlanCount: 0,
  blockedRecoveryCount: 0,
  readyForFutureRecoveryCount: 0,
  escalationRequiredCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getRecoveryDiagnostics(): RecoveryDiagnostics {
  return { ...diagnostics };
}

export function updateRecoveryDiagnostics(query: string, report: RecoveryReport): void {
  diagnostics = {
    recoveryRuntimeActive: true,
    recoveryPlanCount: diagnostics.recoveryPlanCount + 1,
    blockedRecoveryCount: diagnostics.blockedRecoveryCount + (report.state === 'BLOCKED' ? 1 : 0),
    readyForFutureRecoveryCount:
      diagnostics.readyForFutureRecoveryCount +
      (report.state === 'READY_FOR_FUTURE_RECOVERY' ? 1 : 0),
    escalationRequiredCount:
      diagnostics.escalationRequiredCount + (report.state === 'ESCALATION_REQUIRED' ? 1 : 0),
    lastQuery: query,
    lastState: report.state,
  };
}

export function resetRecoveryDiagnostics(): void {
  diagnostics = {
    recoveryRuntimeActive: false,
    recoveryPlanCount: 0,
    blockedRecoveryCount: 0,
    readyForFutureRecoveryCount: 0,
    escalationRequiredCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function recoveryKey(): string {
  const d = diagnostics;
  return [
    String(d.recoveryRuntimeActive),
    String(d.recoveryPlanCount),
    String(d.blockedRecoveryCount),
    String(d.readyForFutureRecoveryCount),
    String(d.escalationRequiredCount),
    d.lastQuery ?? '',
    d.lastState ?? '',
  ].join('|');
}
