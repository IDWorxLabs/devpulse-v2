/**
 * Connected Autonomous Build Execution Foundation — bounded history (max 16).
 */

import { MAX_CONNECTED_BUILD_EXECUTION_HISTORY } from './connected-build-execution-registry.js';
import type {
  BuildOutputState,
  ConnectedBuildExecutionAssessment,
  ConnectedBuildExecutionHistoryEntry,
  ConnectedBuildExecutionHistorySummary,
} from './connected-build-execution-types.js';

const history: ConnectedBuildExecutionHistoryEntry[] = [];

export function resetConnectedBuildExecutionHistoryForTests(): void {
  history.length = 0;
}

export function recordConnectedBuildExecutionAssessment(
  assessment: ConnectedBuildExecutionAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    connectionId: report.connectionId,
    buildOutputScore: report.buildOutputScore,
    buildOutputState: report.buildOutputState,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_CONNECTED_BUILD_EXECUTION_HISTORY) {
    history.length = MAX_CONNECTED_BUILD_EXECUTION_HISTORY;
  }
}

export function getConnectedBuildExecutionHistorySize(): number {
  return history.length;
}

export function getLatestConnectedBuildExecutionHistoryEntry(): ConnectedBuildExecutionHistoryEntry | null {
  return history[0] ?? null;
}

export function getConnectedBuildExecutionHistory(): readonly ConnectedBuildExecutionHistoryEntry[] {
  return [...history];
}

export function countBuildOutputState(
  state: BuildOutputState,
  entries: readonly ConnectedBuildExecutionHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.buildOutputState === state).length;
}

export function buildConnectedBuildExecutionHistorySummary(
  entries: readonly ConnectedBuildExecutionHistoryEntry[] = history,
): ConnectedBuildExecutionHistorySummary {
  return {
    totalAssessments: entries.length,
    provenOutputs: countBuildOutputState('BUILD_OUTPUT_PROVEN', entries),
    partiallyProvenOutputs: countBuildOutputState('BUILD_OUTPUT_PARTIALLY_PROVEN', entries),
    notProvenOutputs: countBuildOutputState('BUILD_OUTPUT_NOT_PROVEN', entries),
    blockedOutputs: countBuildOutputState('BUILD_OUTPUT_BLOCKED', entries),
    insufficientEvidenceOutputs: countBuildOutputState('INSUFFICIENT_EVIDENCE', entries),
  };
}
