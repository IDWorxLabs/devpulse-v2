/**
 * Builder packet execution diagnostics.
 */

import type {
  BuilderPacketExecutionDiagnostics,
  BuilderPacketExecutionReport,
  BuilderPacketExecutionState,
} from './types.js';

let diagnostics: BuilderPacketExecutionDiagnostics = {
  builderPacketExecutionActive: false,
  executionPacketCount: 0,
  blockedPacketCount: 0,
  readyForControlledApplyCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getBuilderPacketExecutionDiagnostics(): BuilderPacketExecutionDiagnostics {
  return { ...diagnostics };
}

export function updateBuilderPacketExecutionDiagnostics(
  query: string,
  report: BuilderPacketExecutionReport,
): void {
  diagnostics = {
    builderPacketExecutionActive: true,
    executionPacketCount: diagnostics.executionPacketCount + 1,
    blockedPacketCount: diagnostics.blockedPacketCount + (report.state === 'BLOCKED' ? 1 : 0),
    readyForControlledApplyCount:
      diagnostics.readyForControlledApplyCount +
      (report.state === 'READY_FOR_CONTROLLED_APPLY' ? 1 : 0),
    lastQuery: query,
    lastState: report.state,
  };
}

export function resetBuilderPacketExecutionDiagnostics(): void {
  diagnostics = {
    builderPacketExecutionActive: false,
    executionPacketCount: 0,
    blockedPacketCount: 0,
    readyForControlledApplyCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function builderPacketExecutionKey(): string {
  const d = diagnostics;
  return [
    String(d.builderPacketExecutionActive),
    String(d.executionPacketCount),
    String(d.blockedPacketCount),
    String(d.readyForControlledApplyCount),
    d.lastQuery ?? '',
    d.lastState ?? '',
  ].join('|');
}
