/**
 * Connected Runtime Execution — bounded history (max 16).
 */

import { MAX_CONNECTED_RUNTIME_EXECUTION_HISTORY } from './connected-runtime-execution-registry.js';
import type {
  ConnectedRuntimeExecutionAssessment,
  ConnectedRuntimeExecutionHistoryEntry,
  ConnectedRuntimeExecutionHistorySummary,
  RuntimeExecutionState,
} from './connected-runtime-execution-types.js';

const history: ConnectedRuntimeExecutionHistoryEntry[] = [];
const assessmentStore: ConnectedRuntimeExecutionAssessment[] = [];

export function resetConnectedRuntimeExecutionHistoryForTests(): void {
  history.length = 0;
  assessmentStore.length = 0;
}

export function recordConnectedRuntimeExecutionAssessment(
  assessment: ConnectedRuntimeExecutionAssessment,
): void {
  const report = assessment.report;
  assessmentStore.unshift(assessment);
  if (assessmentStore.length > MAX_CONNECTED_RUNTIME_EXECUTION_HISTORY) {
    assessmentStore.length = MAX_CONNECTED_RUNTIME_EXECUTION_HISTORY;
  }
  history.unshift({
    timestamp: report.generatedAt,
    executionId: report.executionId,
    runtimeScore: report.runtimeScore,
    runtimeState: report.runtimeState,
    workspaceId: report.activationContract?.workspaceId ?? 'unknown',
    realRuntimeLaunchPerformed: report.activationContract?.realRuntimeLaunchPerformed ?? false,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_CONNECTED_RUNTIME_EXECUTION_HISTORY) {
    history.length = MAX_CONNECTED_RUNTIME_EXECUTION_HISTORY;
  }
}

export function getConnectedRuntimeExecutionHistorySize(): number {
  return history.length;
}

export function getLatestConnectedRuntimeExecutionHistoryEntry(): ConnectedRuntimeExecutionHistoryEntry | null {
  return history[0] ?? null;
}

/** Latest full in-process assessment object (Priority A hydration). */
export function getLatestConnectedRuntimeExecutionAssessment(): ConnectedRuntimeExecutionAssessment | null {
  return assessmentStore[0] ?? null;
}

export function getConnectedRuntimeExecutionHistory(): readonly ConnectedRuntimeExecutionHistoryEntry[] {
  return [...history];
}

export function countRuntimeExecutionState(
  state: RuntimeExecutionState,
  entries: readonly ConnectedRuntimeExecutionHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.runtimeState === state).length;
}

export function buildConnectedRuntimeExecutionHistorySummary(
  entries: readonly ConnectedRuntimeExecutionHistoryEntry[] = history,
): ConnectedRuntimeExecutionHistorySummary {
  return {
    totalAssessments: entries.length,
    activatedRuntimes: countRuntimeExecutionState('RUNTIME_ACTIVATED', entries),
    activatedWithWarningsRuntimes: countRuntimeExecutionState('RUNTIME_ACTIVATED_WITH_WARNINGS', entries),
    failedActivations: countRuntimeExecutionState('RUNTIME_ACTIVATION_FAILED', entries),
    blockedActivations: countRuntimeExecutionState('RUNTIME_ACTIVATION_BLOCKED', entries),
    insufficientEvidenceActivations: countRuntimeExecutionState('INSUFFICIENT_EVIDENCE', entries),
  };
}
