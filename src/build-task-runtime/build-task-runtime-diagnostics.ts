/**
 * Build Task Runtime Foundation diagnostics.
 */

import type { BuildTaskPlan, BuildTaskRuntimeDiagnostics } from './build-task-runtime-types.js';

let diagnostics: BuildTaskRuntimeDiagnostics = {
  buildTaskRuntimeActive: false,
  buildTaskCount: 0,
  blockedTaskCount: 0,
  readyForFutureExecutionCount: 0,
  lastBuildTaskQuery: null,
  lastBuildTaskReadiness: null,
};

export function getBuildTaskRuntimeDiagnostics(): BuildTaskRuntimeDiagnostics {
  return { ...diagnostics };
}

export function updateBuildTaskRuntimeDiagnostics(query: string, plan: BuildTaskPlan): void {
  diagnostics = {
    buildTaskRuntimeActive: true,
    buildTaskCount: diagnostics.buildTaskCount + 1,
    blockedTaskCount: diagnostics.blockedTaskCount + (plan.blocked ? 1 : 0),
    readyForFutureExecutionCount:
      diagnostics.readyForFutureExecutionCount +
      (plan.state === 'READY_FOR_FUTURE_EXECUTION' ? 1 : 0),
    lastBuildTaskQuery: query,
    lastBuildTaskReadiness: plan.readiness,
  };
}

export function resetBuildTaskRuntimeDiagnostics(): void {
  diagnostics = {
    buildTaskRuntimeActive: false,
    buildTaskCount: 0,
    blockedTaskCount: 0,
    readyForFutureExecutionCount: 0,
    lastBuildTaskQuery: null,
    lastBuildTaskReadiness: null,
  };
}

export function buildTaskRuntimeKey(): string {
  const d = diagnostics;
  return [
    String(d.buildTaskRuntimeActive),
    String(d.buildTaskCount),
    String(d.blockedTaskCount),
    String(d.readyForFutureExecutionCount),
    d.lastBuildTaskQuery ?? 'none',
    d.lastBuildTaskReadiness ?? 'none',
  ].join('|');
}
