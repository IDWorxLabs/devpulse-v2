/**
 * Connected Build Execution — bounded history.
 */

import { MAX_CONNECTED_BUILD_EXECUTION_HISTORY } from './connected-build-execution-registry.js';
import type {
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
    assessmentId: report.assessmentId,
    proofLevel: report.proofLevel,
    linkageConnected: report.linkageAnalysis.linkageConnected,
    materializationState: report.buildMaterialization.materializationState,
  });
  if (history.length > MAX_CONNECTED_BUILD_EXECUTION_HISTORY) {
    history.length = MAX_CONNECTED_BUILD_EXECUTION_HISTORY;
  }
}

export function getConnectedBuildExecutionHistorySize(): number {
  return history.length;
}

export function buildConnectedBuildExecutionHistorySummary(
  entries: readonly ConnectedBuildExecutionHistoryEntry[] = history,
): ConnectedBuildExecutionHistorySummary {
  return {
    totalAssessments: entries.length,
    provenBuilds: entries.filter((e) => e.proofLevel === 'PROVEN').length,
    partialBuilds: entries.filter((e) => e.proofLevel === 'PARTIAL').length,
    notProvenBuilds: entries.filter((e) => e.proofLevel === 'NOT_PROVEN').length,
  };
}
