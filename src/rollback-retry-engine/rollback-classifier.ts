/**
 * Rollback classifier — determines rollback state from failure scenario.
 * Planning only. No rollback execution.
 */

import type { FailureScenario, RollbackState } from './types.js';

export function classifyRollbackState(scenario: FailureScenario): RollbackState {
  switch (scenario) {
    case 'MISSING_RUNTIME':
    case 'MISSING_VERIFICATION':
    case 'APPROVAL_MISSING':
    case 'NONE':
      return 'ROLLBACK_NOT_REQUIRED';
    case 'WRONG_GATE_MAPPING':
    case 'CONTRADICTION_PRESENT':
      return 'ROLLBACK_RECOMMENDED';
    case 'FAILED_REALITY_VALIDATION':
    case 'AUTONOMY_FAILURE':
      return 'ROLLBACK_REQUIRED';
    default:
      return 'ROLLBACK_NOT_REQUIRED';
  }
}

export function rollbackRequiresApproval(state: RollbackState): boolean {
  return state === 'ROLLBACK_RECOMMENDED' || state === 'ROLLBACK_REQUIRED';
}
