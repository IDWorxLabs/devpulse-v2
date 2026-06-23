/**
 * Phase 26.98 — Launch artifact completion history (V1).
 */

import type { LaunchReadinessArtifactCompletionBarrierRepairReport } from './launch-readiness-artifact-completion-barrier-repair-types.js';

const history: LaunchReadinessArtifactCompletionBarrierRepairReport[] = [];

export function recordLaunchReadinessArtifactCompletionBarrierRepair(
  report: LaunchReadinessArtifactCompletionBarrierRepairReport,
): void {
  history.push({ ...report, passToken: report.passToken });
}

export function getLaunchReadinessArtifactCompletionBarrierRepairHistory(): readonly LaunchReadinessArtifactCompletionBarrierRepairReport[] {
  return history;
}

export function getLatestLaunchReadinessArtifactCompletionBarrierRepair():
  | LaunchReadinessArtifactCompletionBarrierRepairReport
  | null {
  return history.length > 0 ? history[history.length - 1]! : null;
}

export function resetLaunchReadinessArtifactCompletionBarrierRepairHistoryForTests(): void {
  history.length = 0;
}
