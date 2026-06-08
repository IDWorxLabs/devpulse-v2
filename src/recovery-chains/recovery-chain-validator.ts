/**
 * Recovery chain validator — validates generated chain structure.
 */

import { chainIncludesStepType } from './recovery-step-classifier.js';
import type { FailureType, RecoveryChain, RecoveryStep } from './types.js';

export interface ChainValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRecoveryChain(
  failureType: FailureType,
  steps: RecoveryStep[],
): ChainValidationResult {
  const errors: string[] = [];

  if (steps.length === 0) {
    errors.push('Recovery chain must contain at least one step');
  }

  const orders = steps.map((s) => s.order);
  if (new Set(orders).size !== orders.length) {
    errors.push('Recovery step orders must be unique');
  }

  switch (failureType) {
    case 'MISSING_RUNTIME':
      if (!chainIncludesStepType(steps, 'INVESTIGATE') || !chainIncludesStepType(steps, 'VERIFY')) {
        errors.push('Missing runtime chain requires INVESTIGATE and VERIFY steps');
      }
      break;
    case 'MISSING_APPROVAL':
      if (
        !chainIncludesStepType(steps, 'REQUEST_APPROVAL') ||
        !chainIncludesStepType(steps, 'WAIT_FOR_GATE') ||
        !chainIncludesStepType(steps, 'VERIFY')
      ) {
        errors.push('Missing approval chain requires REQUEST_APPROVAL, WAIT_FOR_GATE, and VERIFY steps');
      }
      break;
    case 'FAILED_VERIFICATION':
      if (
        !chainIncludesStepType(steps, 'INVESTIGATE') ||
        !chainIncludesStepType(steps, 'RETRY') ||
        !chainIncludesStepType(steps, 'VERIFY')
      ) {
        errors.push('Failed verification chain requires INVESTIGATE, RETRY, and VERIFY steps');
      }
      break;
    case 'WRONG_GATE_MAPPING':
      if (
        !chainIncludesStepType(steps, 'INVESTIGATE') ||
        !chainIncludesStepType(steps, 'REQUEST_APPROVAL') ||
        !chainIncludesStepType(steps, 'VERIFY')
      ) {
        errors.push('Wrong gate chain requires INVESTIGATE, REQUEST_APPROVAL, and VERIFY steps');
      }
      break;
    case 'AUTONOMY_FAILURE':
      if (
        !chainIncludesStepType(steps, 'ESCALATE') ||
        !chainIncludesStepType(steps, 'REQUEST_APPROVAL') ||
        !chainIncludesStepType(steps, 'WAIT_FOR_GATE') ||
        !chainIncludesStepType(steps, 'VERIFY')
      ) {
        errors.push('Autonomy failure chain requires ESCALATE, REQUEST_APPROVAL, WAIT_FOR_GATE, and VERIFY steps');
      }
      break;
    default:
      break;
  }

  return { valid: errors.length === 0, errors };
}

export function assertChainReady(chain: RecoveryChain): boolean {
  const validation = validateRecoveryChain(chain.failureType, chain.recoverySteps);
  return validation.valid && chain.stateSequence.includes('CHAIN_READY');
}
