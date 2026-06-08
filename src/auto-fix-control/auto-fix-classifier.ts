/**
 * Auto-fix classifier — maps recovery chain context to fix types.
 */

import { chainIncludesStepType } from '../recovery-chains/recovery-step-classifier.js';
import type { RecoveryChain } from '../recovery-chains/types.js';
import type { AutoFixEvaluationInput, FixType } from './types.js';

export function classifyFixType(input: AutoFixEvaluationInput): FixType {
  if (input.fixType) {
    return input.fixType;
  }

  if (input.world2Related === true) {
    return 'WORLD2_FIX';
  }

  const chain = input.recoveryChain;
  if (!chain) {
    return 'READ_ONLY_FIX';
  }

  if (chain.failureType === 'AUTONOMY_FAILURE' || chainIncludesStepType(chain.recoverySteps, 'ESCALATE')) {
    return 'AUTONOMY_FIX';
  }

  if (chainIncludesStepType(chain.recoverySteps, 'ROLLBACK')) {
    return 'ROLLBACK_FIX';
  }

  if (chainIncludesStepType(chain.recoverySteps, 'RETRY')) {
    return 'RECOVERY_FIX';
  }

  if (chain.failureType === 'MISSING_APPROVAL' || chain.failureType === 'WRONG_GATE_MAPPING') {
    return 'CONFIGURATION_FIX';
  }

  if (chain.failureType === 'MONITOR_ONLY' || chainIncludesStepType(chain.recoverySteps, 'MONITOR')) {
    return 'READ_ONLY_FIX';
  }

  if (chain.failureType === 'FAILED_VERIFICATION' || chain.failureType === 'MISSING_RUNTIME') {
    return 'RECOVERY_FIX';
  }

  return 'READ_ONLY_FIX';
}

export function fixTypeLabel(fixType: FixType): string {
  return fixType.replace(/_/g, ' ').toLowerCase();
}
