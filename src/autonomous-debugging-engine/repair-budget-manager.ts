/**
 * Autonomous Debugging Engine — repair budget manager.
 */

import {
  DEFAULT_REPAIR_LOOP_MAX_ATTEMPTS,
  DEFAULT_REPAIR_MAX_TOUCHED_FILES,
} from './autonomous-debugging-types.js';

export interface RepairBudgetState {
  readOnly: true;
  attemptNumber: number;
  touchedFiles: number;
  elapsedMs: number;
  exhausted: boolean;
  exhaustionReason: string | null;
}

export function createRepairBudgetState(): RepairBudgetState {
  return {
    readOnly: true,
    attemptNumber: 0,
    touchedFiles: 0,
    elapsedMs: 0,
    exhausted: false,
    exhaustionReason: null,
  };
}

export function isRepairBudgetAvailable(input: {
  state: RepairBudgetState;
  nextAttemptNumber: number;
  nextTouchedFiles: number;
  maxAttempts?: number;
  maxTouchedFiles?: number;
}): boolean {
  const maxAttempts = input.maxAttempts ?? DEFAULT_REPAIR_LOOP_MAX_ATTEMPTS;
  const maxTouchedFiles = input.maxTouchedFiles ?? DEFAULT_REPAIR_MAX_TOUCHED_FILES;

  if (input.state.exhausted) return false;
  if (input.nextAttemptNumber > maxAttempts) return false;
  if (input.nextTouchedFiles > maxTouchedFiles) return false;
  return true;
}

export function recordRepairBudgetUsage(input: {
  state: RepairBudgetState;
  attemptNumber: number;
  touchedFiles: number;
  maxAttempts?: number;
  maxTouchedFiles?: number;
}): RepairBudgetState {
  const maxAttempts = input.maxAttempts ?? DEFAULT_REPAIR_LOOP_MAX_ATTEMPTS;
  const maxTouchedFiles = input.maxTouchedFiles ?? DEFAULT_REPAIR_MAX_TOUCHED_FILES;
  const next: RepairBudgetState = {
    readOnly: true,
    attemptNumber: input.attemptNumber,
    touchedFiles: input.touchedFiles,
    elapsedMs: input.state.elapsedMs,
    exhausted: false,
    exhaustionReason: null,
  };

  if (input.attemptNumber >= maxAttempts) {
    return {
      ...next,
      exhausted: true,
      exhaustionReason: `Maximum repair attempts (${maxAttempts}) reached`,
    };
  }
  if (input.touchedFiles > maxTouchedFiles) {
    return {
      ...next,
      exhausted: true,
      exhaustionReason: `Maximum touched files (${maxTouchedFiles}) exceeded`,
    };
  }
  return next;
}

export function buildBudgetExhaustionEvidence(state: RepairBudgetState): string[] {
  if (!state.exhausted) return [];
  return [
    state.exhaustionReason ?? 'Repair budget exhausted',
    `Attempts used: ${state.attemptNumber}`,
    `Files touched: ${state.touchedFiles}`,
  ];
}
