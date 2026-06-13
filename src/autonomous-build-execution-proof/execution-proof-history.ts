/**
 * Autonomous Build Execution Proof — bounded history (max 16).
 */

import { MAX_AUTONOMOUS_BUILD_EXECUTION_PROOF_HISTORY } from './autonomous-build-execution-proof-registry.js';
import type {
  AutonomousBuildExecutionProofAssessment,
  AutonomousBuildExecutionProofHistoryEntry,
  AutonomousBuildExecutionProofHistorySummary,
} from './autonomous-build-execution-proof-types.js';

const history: AutonomousBuildExecutionProofHistoryEntry[] = [];

export function resetAutonomousBuildExecutionProofHistoryForTests(): void {
  history.length = 0;
}

export function recordAutonomousBuildExecutionProofAssessment(
  assessment: AutonomousBuildExecutionProofAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    proofId: report.proofId,
    chainConnected: report.chainConnected,
    firstBrokenStage: report.firstBrokenStage,
    stageCount: report.stageProofs.length,
  });
  if (history.length > MAX_AUTONOMOUS_BUILD_EXECUTION_PROOF_HISTORY) {
    history.length = MAX_AUTONOMOUS_BUILD_EXECUTION_PROOF_HISTORY;
  }
}

export function getAutonomousBuildExecutionProofHistorySize(): number {
  return history.length;
}

export function getAutonomousBuildExecutionProofHistory(): readonly AutonomousBuildExecutionProofHistoryEntry[] {
  return [...history];
}

export function buildAutonomousBuildExecutionProofHistorySummary(
  entries: readonly AutonomousBuildExecutionProofHistoryEntry[] = history,
): AutonomousBuildExecutionProofHistorySummary {
  return {
    totalAssessments: entries.length,
    connectedChains: entries.filter((e) => e.chainConnected).length,
    disconnectedChains: entries.filter((e) => !e.chainConnected).length,
  };
}
