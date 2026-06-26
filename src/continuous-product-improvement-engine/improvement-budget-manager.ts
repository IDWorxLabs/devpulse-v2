/**
 * Continuous Product Improvement Engine — improvement budget management.
 */

import { DEFAULT_IMPROVEMENT_LOOP_MAX_ATTEMPTS, DEFAULT_IMPROVEMENT_MAX_TOUCHED_FILES } from './continuous-improvement-types.js';

export interface ImprovementBudgetState {
  readOnly: true;
  attemptsUsed: number;
  filesTouched: number;
  regressionsSeen: number;
  exhausted: boolean;
}

export function createImprovementBudgetState(): ImprovementBudgetState {
  return { readOnly: true, attemptsUsed: 0, filesTouched: 0, regressionsSeen: 0, exhausted: false };
}

export function isImprovementBudgetAvailable(input: {
  state: ImprovementBudgetState;
  nextAttemptNumber: number;
  nextTouchedFiles: number;
  maxAttempts?: number;
}): boolean {
  const maxAttempts = input.maxAttempts ?? DEFAULT_IMPROVEMENT_LOOP_MAX_ATTEMPTS;
  if (input.nextAttemptNumber > maxAttempts) return false;
  if (input.state.filesTouched + input.nextTouchedFiles > DEFAULT_IMPROVEMENT_MAX_TOUCHED_FILES) return false;
  return !input.state.exhausted;
}

export function recordImprovementBudgetUsage(input: {
  state: ImprovementBudgetState;
  attemptNumber: number;
  touchedFiles: number;
  maxAttempts?: number;
  regressionFailed?: boolean;
}): ImprovementBudgetState {
  const maxAttempts = input.maxAttempts ?? DEFAULT_IMPROVEMENT_LOOP_MAX_ATTEMPTS;
  const regressionsSeen = input.state.regressionsSeen + (input.regressionFailed ? 1 : 0);
  const attemptsUsed = input.attemptNumber;
  const filesTouched = input.state.filesTouched + input.touchedFiles;
  const exhausted =
    attemptsUsed >= maxAttempts ||
    filesTouched > DEFAULT_IMPROVEMENT_MAX_TOUCHED_FILES ||
    regressionsSeen >= 2;

  return {
    readOnly: true,
    attemptsUsed,
    filesTouched,
    regressionsSeen,
    exhausted,
  };
}

export function buildImprovementBudgetExhaustionEvidence(state: ImprovementBudgetState): string[] {
  const evidence: string[] = [];
  if (state.attemptsUsed >= DEFAULT_IMPROVEMENT_LOOP_MAX_ATTEMPTS) {
    evidence.push('Maximum improvement attempts reached');
  }
  if (state.filesTouched > DEFAULT_IMPROVEMENT_MAX_TOUCHED_FILES) {
    evidence.push('Maximum touched files budget exceeded');
  }
  if (state.regressionsSeen >= 2) {
    evidence.push('Maximum regression count reached');
  }
  return evidence;
}
