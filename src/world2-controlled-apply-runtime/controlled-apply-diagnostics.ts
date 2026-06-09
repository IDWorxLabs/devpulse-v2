/**
 * Controlled apply runtime diagnostics.
 */

import type {
  ControlledApplyDiagnostics,
  ControlledApplyReport,
} from './types.js';

let diagnostics: ControlledApplyDiagnostics = {
  controlledApplyRuntimeActive: false,
  applyPlanCount: 0,
  blockedApplyCount: 0,
  readyForFutureApplyCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getControlledApplyDiagnostics(): ControlledApplyDiagnostics {
  return { ...diagnostics };
}

export function updateControlledApplyDiagnostics(
  query: string,
  report: ControlledApplyReport,
): void {
  diagnostics = {
    controlledApplyRuntimeActive: true,
    applyPlanCount: diagnostics.applyPlanCount + 1,
    blockedApplyCount: diagnostics.blockedApplyCount + (report.state === 'BLOCKED' ? 1 : 0),
    readyForFutureApplyCount:
      diagnostics.readyForFutureApplyCount +
      (report.state === 'READY_FOR_FUTURE_APPLY' ? 1 : 0),
    lastQuery: query,
    lastState: report.state,
  };
}

export function resetControlledApplyDiagnostics(): void {
  diagnostics = {
    controlledApplyRuntimeActive: false,
    applyPlanCount: 0,
    blockedApplyCount: 0,
    readyForFutureApplyCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function controlledApplyKey(): string {
  const d = diagnostics;
  return [
    String(d.controlledApplyRuntimeActive),
    String(d.applyPlanCount),
    String(d.blockedApplyCount),
    String(d.readyForFutureApplyCount),
    d.lastQuery ?? '',
    d.lastState ?? '',
  ].join('|');
}
