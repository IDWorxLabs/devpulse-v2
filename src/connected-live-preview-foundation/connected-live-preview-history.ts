/**
 * Connected Live Preview Foundation — bounded history (max 16).
 */

import { MAX_CONNECTED_LIVE_PREVIEW_HISTORY } from './connected-live-preview-registry.js';
import type {
  ConnectedLivePreviewAssessment,
  ConnectedLivePreviewHistoryEntry,
  ConnectedLivePreviewHistorySummary,
  PreviewState,
} from './connected-live-preview-types.js';

const history: ConnectedLivePreviewHistoryEntry[] = [];

export function resetConnectedLivePreviewHistoryForTests(): void {
  history.length = 0;
}

export function recordConnectedLivePreviewAssessment(
  assessment: ConnectedLivePreviewAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    previewConnectionId: report.previewConnectionId,
    previewReadinessScore: report.previewReadinessScore,
    previewState: report.previewState,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_CONNECTED_LIVE_PREVIEW_HISTORY) {
    history.length = MAX_CONNECTED_LIVE_PREVIEW_HISTORY;
  }
}

export function getConnectedLivePreviewHistorySize(): number {
  return history.length;
}

export function getLatestConnectedLivePreviewHistoryEntry(): ConnectedLivePreviewHistoryEntry | null {
  return history[0] ?? null;
}

export function getConnectedLivePreviewHistory(): readonly ConnectedLivePreviewHistoryEntry[] {
  return [...history];
}

export function countPreviewState(
  state: PreviewState,
  entries: readonly ConnectedLivePreviewHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.previewState === state).length;
}

export function buildConnectedLivePreviewHistorySummary(
  entries: readonly ConnectedLivePreviewHistoryEntry[] = history,
): ConnectedLivePreviewHistorySummary {
  return {
    totalAssessments: entries.length,
    readyPreviews: countPreviewState('PREVIEW_READY', entries),
    readyWithWarningsPreviews: countPreviewState('PREVIEW_READY_WITH_WARNINGS', entries),
    notReadyPreviews: countPreviewState('PREVIEW_NOT_READY', entries),
    blockedPreviews: countPreviewState('PREVIEW_BLOCKED', entries),
    insufficientEvidencePreviews: countPreviewState('INSUFFICIENT_EVIDENCE', entries),
  };
}
