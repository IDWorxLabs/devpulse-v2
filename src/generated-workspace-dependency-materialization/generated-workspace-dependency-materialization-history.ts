/**
 * Generated Workspace Dependency Materialization — bounded history (Phase 26.78).
 */

import type {
  GeneratedWorkspaceDependencyMaterializationAssessment,
  GeneratedWorkspaceDependencyMaterializationHistoryEntry,
} from './generated-workspace-dependency-materialization-types.js';

const MAX_HISTORY = 32;
const history: GeneratedWorkspaceDependencyMaterializationHistoryEntry[] = [];

export function resetGeneratedWorkspaceDependencyMaterializationHistoryForTests(): void {
  history.length = 0;
}

export function recordGeneratedWorkspaceDependencyMaterializationAssessment(
  assessment: GeneratedWorkspaceDependencyMaterializationAssessment,
): void {
  history.unshift({
    readOnly: true,
    assessmentId: assessment.report.assessmentId,
    generatedAt: assessment.report.generatedAt,
    dependencyState: assessment.report.dependencyState,
    dependenciesReady: assessment.report.dependenciesReady,
    workspaceId: assessment.report.workspaceId,
    cacheKey: assessment.cacheKey,
  });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

export function getGeneratedWorkspaceDependencyMaterializationHistorySize(): number {
  return history.length;
}

export function getLatestGeneratedWorkspaceDependencyMaterializationHistoryEntry(): GeneratedWorkspaceDependencyMaterializationHistoryEntry | null {
  return history[0] ?? null;
}

export function getGeneratedWorkspaceDependencyMaterializationHistory(): readonly GeneratedWorkspaceDependencyMaterializationHistoryEntry[] {
  return history;
}
