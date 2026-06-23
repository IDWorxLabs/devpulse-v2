/**
 * Generated Workspace Dependency Installation Executor — bounded history (Phase 26.79).
 */

import { MAX_INSTALL_EXECUTOR_HISTORY } from './generated-workspace-dependency-installation-executor-registry.js';
import type {
  GeneratedWorkspaceDependencyInstallationExecutorAssessment,
  GeneratedWorkspaceDependencyInstallationExecutorHistoryEntry,
} from './generated-workspace-dependency-installation-executor-types.js';

const history: GeneratedWorkspaceDependencyInstallationExecutorHistoryEntry[] = [];

export function resetGeneratedWorkspaceDependencyInstallationExecutorHistoryForTests(): void {
  history.length = 0;
}

export function recordGeneratedWorkspaceDependencyInstallationExecutorAssessment(
  assessment: GeneratedWorkspaceDependencyInstallationExecutorAssessment,
): void {
  history.unshift({
    readOnly: true,
    executionId: assessment.report.executionId,
    generatedAt: assessment.report.generatedAt,
    executionMode: assessment.report.executionMode,
    installSucceeded: assessment.report.processResult.installSucceeded,
    verificationSucceeded: assessment.report.postInstallVerification.verificationSucceeded,
    workspaceId: assessment.report.workspaceId,
    cacheKey: assessment.cacheKey,
  });
  if (history.length > MAX_INSTALL_EXECUTOR_HISTORY) {
    history.length = MAX_INSTALL_EXECUTOR_HISTORY;
  }
}

export function getGeneratedWorkspaceDependencyInstallationExecutorHistorySize(): number {
  return history.length;
}

export function getLatestGeneratedWorkspaceDependencyInstallationExecutorHistoryEntry(): GeneratedWorkspaceDependencyInstallationExecutorHistoryEntry | null {
  return history[0] ?? null;
}

export function getGeneratedWorkspaceDependencyInstallationExecutorHistory(): readonly GeneratedWorkspaceDependencyInstallationExecutorHistoryEntry[] {
  return history;
}
