/**
 * Connected Live Preview Execution — bounded history (max 16).
 */

import { MAX_CONNECTED_LIVE_PREVIEW_EXECUTION_HISTORY } from './connected-live-preview-execution-registry.js';
import type {
  ConnectedLivePreviewExecutionAssessment,
  ConnectedLivePreviewExecutionHistoryEntry,
  ConnectedLivePreviewExecutionHistorySummary,
  PreviewExecutionState,
} from './connected-live-preview-execution-types.js';

const history: ConnectedLivePreviewExecutionHistoryEntry[] = [];
const assessmentStore: ConnectedLivePreviewExecutionAssessment[] = [];

export function resetConnectedLivePreviewExecutionHistoryForTests(): void {
  history.length = 0;
  assessmentStore.length = 0;
}

export function recordConnectedLivePreviewExecutionAssessment(
  assessment: ConnectedLivePreviewExecutionAssessment,
): void {
  const report = assessment.report;
  assessmentStore.unshift(assessment);
  if (assessmentStore.length > MAX_CONNECTED_LIVE_PREVIEW_EXECUTION_HISTORY) {
    assessmentStore.length = MAX_CONNECTED_LIVE_PREVIEW_EXECUTION_HISTORY;
  }
  history.unshift({
    timestamp: report.generatedAt,
    executionId: report.executionId,
    previewScore: report.previewScore,
    previewState: report.previewState,
    workspaceId: report.activationContract?.workspaceId ?? 'unknown',
    previewUrl: report.previewUrl,
    realPreviewLaunchPerformed: report.activationContract?.realPreviewLaunchPerformed ?? false,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_CONNECTED_LIVE_PREVIEW_EXECUTION_HISTORY) {
    history.length = MAX_CONNECTED_LIVE_PREVIEW_EXECUTION_HISTORY;
  }
}

export function getConnectedLivePreviewExecutionHistorySize(): number {
  return history.length;
}

export function getLatestConnectedLivePreviewExecutionHistoryEntry(): ConnectedLivePreviewExecutionHistoryEntry | null {
  return history[0] ?? null;
}

/** Latest full in-process assessment object (Priority A hydration). */
export function getLatestConnectedLivePreviewExecutionAssessment(): ConnectedLivePreviewExecutionAssessment | null {
  return assessmentStore[0] ?? null;
}

export function getConnectedLivePreviewExecutionHistory(): readonly ConnectedLivePreviewExecutionHistoryEntry[] {
  return [...history];
}

export function countPreviewExecutionState(
  state: PreviewExecutionState,
  entries: readonly ConnectedLivePreviewExecutionHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.previewState === state).length;
}

export function buildConnectedLivePreviewExecutionHistorySummary(
  entries: readonly ConnectedLivePreviewExecutionHistoryEntry[] = history,
): ConnectedLivePreviewExecutionHistorySummary {
  return {
    totalAssessments: entries.length,
    activatedPreviews: countPreviewExecutionState('PREVIEW_ACTIVATED', entries),
    activatedWithWarningsPreviews: countPreviewExecutionState('PREVIEW_ACTIVATED_WITH_WARNINGS', entries),
    failedActivations: countPreviewExecutionState('PREVIEW_ACTIVATION_FAILED', entries),
    blockedActivations: countPreviewExecutionState('PREVIEW_ACTIVATION_BLOCKED', entries),
    insufficientEvidenceActivations: countPreviewExecutionState('INSUFFICIENT_EVIDENCE', entries),
  };
}
