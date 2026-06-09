/**
 * Auto-Fix Runtime Foundation diagnostics.
 */

import type { AutoFixPlan, AutoFixRuntimeDiagnostics } from './auto-fix-runtime-types.js';

let diagnostics: AutoFixRuntimeDiagnostics = {
  autoFixRuntimeActive: false,
  autoFixPlanCount: 0,
  blockedFixCount: 0,
  readyForFutureFixingCount: 0,
  lastFixQuery: null,
  lastFixReadiness: null,
};

export function getAutoFixRuntimeDiagnostics(): AutoFixRuntimeDiagnostics {
  return { ...diagnostics };
}

export function updateAutoFixRuntimeDiagnostics(query: string, plan: AutoFixPlan): void {
  diagnostics = {
    autoFixRuntimeActive: true,
    autoFixPlanCount: diagnostics.autoFixPlanCount + 1,
    blockedFixCount: diagnostics.blockedFixCount + (plan.blocked ? 1 : 0),
    readyForFutureFixingCount:
      diagnostics.readyForFutureFixingCount +
      (plan.state === 'READY_FOR_FUTURE_FIXING' ? 1 : 0),
    lastFixQuery: query,
    lastFixReadiness: plan.readiness,
  };
}

export function resetAutoFixRuntimeDiagnostics(): void {
  diagnostics = {
    autoFixRuntimeActive: false,
    autoFixPlanCount: 0,
    blockedFixCount: 0,
    readyForFutureFixingCount: 0,
    lastFixQuery: null,
    lastFixReadiness: null,
  };
}

export function autoFixRuntimeKey(): string {
  const d = diagnostics;
  return [
    String(d.autoFixRuntimeActive),
    String(d.autoFixPlanCount),
    String(d.blockedFixCount),
    String(d.readyForFutureFixingCount),
    d.lastFixQuery ?? 'none',
    d.lastFixReadiness ?? 'none',
  ].join('|');
}
