/**
 * Phase 27.05 — Intake validation stage transition history (V1).
 */

import type { IntakeValidationStageTransitionRepairReport } from './intake-validation-stage-transition-repair-types.js';

const history: IntakeValidationStageTransitionRepairReport[] = [];

export function recordIntakeValidationStageTransitionRepair(
  report: IntakeValidationStageTransitionRepairReport,
): void {
  history.push(report);
  if (history.length > 32) {
    history.shift();
  }
}

export function getIntakeValidationStageTransitionRepairHistory(): readonly IntakeValidationStageTransitionRepairReport[] {
  return history;
}

export function resetIntakeValidationStageTransitionRepairHistoryForTests(): void {
  history.length = 0;
}
