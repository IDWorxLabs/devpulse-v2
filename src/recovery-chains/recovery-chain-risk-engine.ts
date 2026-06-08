/**
 * Recovery chain risk engine — evaluates chain risk from failure type and steps.
 */

import { chainIncludesStepType } from './recovery-step-classifier.js';
import type { ChainRiskLevel, FailureType, RecoveryStep } from './types.js';

export function evaluateChainRisk(failureType: FailureType, steps: RecoveryStep[]): ChainRiskLevel {
  if (failureType === 'AUTONOMY_FAILURE' || chainIncludesStepType(steps, 'ESCALATE')) {
    return 'CRITICAL';
  }

  if (
    failureType === 'MISSING_APPROVAL' ||
    failureType === 'FAILED_VERIFICATION' ||
    failureType === 'WRONG_GATE_MAPPING' ||
    chainIncludesStepType(steps, 'RETRY') ||
    chainIncludesStepType(steps, 'ROLLBACK') ||
    chainIncludesStepType(steps, 'REQUEST_APPROVAL')
  ) {
    return 'HIGH';
  }

  if (failureType === 'MISSING_RUNTIME' || chainIncludesStepType(steps, 'INVESTIGATE')) {
    return 'MEDIUM';
  }

  if (failureType === 'MONITOR_ONLY' || chainIncludesStepType(steps, 'MONITOR')) {
    return 'LOW';
  }

  return 'MEDIUM';
}
