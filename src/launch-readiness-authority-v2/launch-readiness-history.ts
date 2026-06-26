/**
 * Launch Readiness Authority V2 — decision history.
 */

import type { LaunchDecisionAuditRecord, LaunchReadinessPipelineResult } from './launch-readiness-types.js';
import { DEFAULT_MAX_LAUNCH_READINESS_HISTORY } from './launch-readiness-types.js';

const history: LaunchDecisionAuditRecord[] = [];

export function recordLaunchReadinessDecision(result: LaunchReadinessPipelineResult): void {
  history.unshift(result.audit);
  if (history.length > DEFAULT_MAX_LAUNCH_READINESS_HISTORY) {
    history.length = DEFAULT_MAX_LAUNCH_READINESS_HISTORY;
  }
}

export function getLaunchReadinessHistory(): readonly LaunchDecisionAuditRecord[] {
  return history;
}

export function getLatestLaunchReadinessDecision(): LaunchDecisionAuditRecord | null {
  return history[0] ?? null;
}

export function resetLaunchReadinessHistoryForTests(): void {
  history.length = 0;
}
