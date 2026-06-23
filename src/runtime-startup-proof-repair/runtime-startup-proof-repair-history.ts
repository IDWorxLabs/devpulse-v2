/**
 * Runtime Startup Proof Repair — bounded history (Phase 26.77).
 */

import { MAX_RUNTIME_STARTUP_PROOF_REPAIR_HISTORY } from './runtime-startup-proof-repair-registry.js';
import type {
  RuntimeStartupProofRepairAssessment,
  RuntimeStartupProofRepairHistoryEntry,
} from './runtime-startup-proof-repair-types.js';

const history: RuntimeStartupProofRepairHistoryEntry[] = [];

export function resetRuntimeStartupProofRepairHistoryForTests(): void {
  history.length = 0;
}

export function recordRuntimeStartupProofRepairAssessment(
  assessment: RuntimeStartupProofRepairAssessment,
): void {
  history.unshift({
    readOnly: true,
    repairId: assessment.report.repairId,
    generatedAt: assessment.report.generatedAt,
    applicationBoots: assessment.report.applicationBoots,
    failureClass: assessment.report.failureClass,
    workspaceId: assessment.report.workspaceId,
    cacheKey: assessment.cacheKey,
  });
  if (history.length > MAX_RUNTIME_STARTUP_PROOF_REPAIR_HISTORY) {
    history.length = MAX_RUNTIME_STARTUP_PROOF_REPAIR_HISTORY;
  }
}

export function getRuntimeStartupProofRepairHistorySize(): number {
  return history.length;
}

export function getLatestRuntimeStartupProofRepairHistoryEntry(): RuntimeStartupProofRepairHistoryEntry | null {
  return history[0] ?? null;
}

export function getRuntimeStartupProofRepairHistory(): readonly RuntimeStartupProofRepairHistoryEntry[] {
  return history;
}
