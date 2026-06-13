/**
 * Connected Verification Execution — bounded history (max 16).
 */

import { MAX_CONNECTED_VERIFICATION_EXECUTION_HISTORY } from './connected-verification-execution-registry.js';
import type {
  ConnectedVerificationExecutionAssessment,
  ConnectedVerificationExecutionHistoryEntry,
  ConnectedVerificationExecutionHistorySummary,
  VerificationExecutionState,
} from './connected-verification-execution-types.js';

const history: ConnectedVerificationExecutionHistoryEntry[] = [];
const assessmentStore: ConnectedVerificationExecutionAssessment[] = [];

export function resetConnectedVerificationExecutionHistoryForTests(): void {
  history.length = 0;
  assessmentStore.length = 0;
}

export function recordConnectedVerificationExecutionAssessment(
  assessment: ConnectedVerificationExecutionAssessment,
): void {
  const report = assessment.report;
  assessmentStore.unshift(assessment);
  if (assessmentStore.length > MAX_CONNECTED_VERIFICATION_EXECUTION_HISTORY) {
    assessmentStore.length = MAX_CONNECTED_VERIFICATION_EXECUTION_HISTORY;
  }
  history.unshift({
    timestamp: report.generatedAt,
    executionId: report.executionId,
    verificationScore: report.verificationScore,
    verificationState: report.verificationState,
    workspaceId: report.executionContract?.workspaceId ?? 'unknown',
    checksExecuted: report.executionContract?.executionEvidence.verificationChecksExecuted ?? 0,
    realVerificationExecutionPerformed:
      report.executionContract?.realVerificationExecutionPerformed ?? false,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_CONNECTED_VERIFICATION_EXECUTION_HISTORY) {
    history.length = MAX_CONNECTED_VERIFICATION_EXECUTION_HISTORY;
  }
}

export function getConnectedVerificationExecutionHistorySize(): number {
  return history.length;
}

export function getLatestConnectedVerificationExecutionHistoryEntry(): ConnectedVerificationExecutionHistoryEntry | null {
  return history[0] ?? null;
}

/** Latest full in-process assessment object (Priority A hydration). */
export function getLatestConnectedVerificationExecutionAssessment(): ConnectedVerificationExecutionAssessment | null {
  return assessmentStore[0] ?? null;
}

export function getConnectedVerificationExecutionHistory(): readonly ConnectedVerificationExecutionHistoryEntry[] {
  return [...history];
}

export function countVerificationExecutionState(
  state: VerificationExecutionState,
  entries: readonly ConnectedVerificationExecutionHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.verificationState === state).length;
}

export function buildConnectedVerificationExecutionHistorySummary(
  entries: readonly ConnectedVerificationExecutionHistoryEntry[] = history,
): ConnectedVerificationExecutionHistorySummary {
  return {
    totalAssessments: entries.length,
    executedVerifications: countVerificationExecutionState('VERIFICATION_EXECUTED', entries),
    executedWithWarningsVerifications: countVerificationExecutionState(
      'VERIFICATION_EXECUTED_WITH_WARNINGS',
      entries,
    ),
    failedExecutions: countVerificationExecutionState('VERIFICATION_EXECUTION_FAILED', entries),
    blockedExecutions: countVerificationExecutionState('VERIFICATION_EXECUTION_BLOCKED', entries),
    insufficientEvidenceExecutions: countVerificationExecutionState('INSUFFICIENT_EVIDENCE', entries),
  };
}
