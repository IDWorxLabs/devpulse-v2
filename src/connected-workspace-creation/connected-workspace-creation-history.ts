/**
 * Connected Workspace Creation — bounded history (max 16).
 */

import { MAX_CONNECTED_WORKSPACE_CREATION_HISTORY } from './connected-workspace-creation-registry.js';
import type {
  ConnectedWorkspaceCreationAssessment,
  ConnectedWorkspaceCreationHistoryEntry,
  ConnectedWorkspaceCreationHistorySummary,
  WorkspaceCreationState,
} from './connected-workspace-creation-types.js';

const history: ConnectedWorkspaceCreationHistoryEntry[] = [];
const assessmentStore: ConnectedWorkspaceCreationAssessment[] = [];

export function resetConnectedWorkspaceCreationHistoryForTests(): void {
  history.length = 0;
  assessmentStore.length = 0;
}

export function recordConnectedWorkspaceCreationAssessment(
  assessment: ConnectedWorkspaceCreationAssessment,
): void {
  const report = assessment.report;
  assessmentStore.unshift(assessment);
  if (assessmentStore.length > MAX_CONNECTED_WORKSPACE_CREATION_HISTORY) {
    assessmentStore.length = MAX_CONNECTED_WORKSPACE_CREATION_HISTORY;
  }
  history.unshift({
    timestamp: report.generatedAt,
    creationId: report.creationId,
    workspaceCreationScore: report.workspaceCreationScore,
    workspaceState: report.workspaceState,
    workspaceId: report.creationContract?.workspaceId ?? 'unknown',
    realFileMutationPerformed: report.creationContract?.realFileMutationPerformed ?? false,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_CONNECTED_WORKSPACE_CREATION_HISTORY) {
    history.length = MAX_CONNECTED_WORKSPACE_CREATION_HISTORY;
  }
}

export function getConnectedWorkspaceCreationHistorySize(): number {
  return history.length;
}

export function getLatestConnectedWorkspaceCreationHistoryEntry(): ConnectedWorkspaceCreationHistoryEntry | null {
  return history[0] ?? null;
}

/** Latest full in-process assessment object (Priority A hydration). */
export function getLatestConnectedWorkspaceCreationAssessment(): ConnectedWorkspaceCreationAssessment | null {
  return assessmentStore[0] ?? null;
}

export function getConnectedWorkspaceCreationHistory(): readonly ConnectedWorkspaceCreationHistoryEntry[] {
  return [...history];
}

export function countWorkspaceCreationState(
  state: WorkspaceCreationState,
  entries: readonly ConnectedWorkspaceCreationHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.workspaceState === state).length;
}

export function buildConnectedWorkspaceCreationHistorySummary(
  entries: readonly ConnectedWorkspaceCreationHistoryEntry[] = history,
): ConnectedWorkspaceCreationHistorySummary {
  return {
    totalAssessments: entries.length,
    createdWorkspaces: countWorkspaceCreationState('WORKSPACE_CREATED', entries),
    createdWithWarningsWorkspaces: countWorkspaceCreationState('WORKSPACE_CREATED_WITH_WARNINGS', entries),
    failedCreations: countWorkspaceCreationState('WORKSPACE_CREATION_FAILED', entries),
    blockedCreations: countWorkspaceCreationState('WORKSPACE_CREATION_BLOCKED', entries),
    insufficientEvidenceCreations: countWorkspaceCreationState('INSUFFICIENT_EVIDENCE', entries),
  };
}
