/**
 * Phase 27.03 — Launch readiness artifact completion history (V1).
 */

import type { LaunchReadinessArtifactCompletionBoundaryRepairReport } from './launch-readiness-artifact-completion-boundary-repair-types.js';

const history: LaunchReadinessArtifactCompletionBoundaryRepairReport[] = [];

export function recordLaunchReadinessArtifactCompletionBoundaryRepair(
  report: LaunchReadinessArtifactCompletionBoundaryRepairReport,
): void {
  history.push(report);
  if (history.length > 32) {
    history.shift();
  }
}

export function getLaunchReadinessArtifactCompletionBoundaryRepairHistory(): readonly LaunchReadinessArtifactCompletionBoundaryRepairReport[] {
  return history;
}

export function resetLaunchReadinessArtifactCompletionBoundaryRepairHistoryForTests(): void {
  history.length = 0;
}
