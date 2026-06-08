/**
 * Retry classifier — determines retry state from failure scenario.
 * Planning only. No retry execution.
 */

import type { FailureScenario, RetryState } from './types.js';

export function classifyRetryState(scenario: FailureScenario): RetryState {
  switch (scenario) {
    case 'MISSING_RUNTIME':
    case 'MISSING_VERIFICATION':
    case 'WRONG_GATE_MAPPING':
      return 'RETRY_REQUIRED';
    case 'CONTRADICTION_PRESENT':
      return 'RETRY_RECOMMENDED';
    case 'APPROVAL_MISSING':
    case 'FAILED_REALITY_VALIDATION':
    case 'AUTONOMY_FAILURE':
    case 'NONE':
      return 'RETRY_NOT_REQUIRED';
    default:
      return 'RETRY_NOT_REQUIRED';
  }
}

export function retryRequiresVerification(state: RetryState): boolean {
  return state === 'RETRY_RECOMMENDED' || state === 'RETRY_REQUIRED';
}
