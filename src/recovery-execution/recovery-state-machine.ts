/**
 * Recovery state machine — deterministic planning states only.
 */

import type { RecoveryPlan } from './types.js';
import type { RecoveryState } from './types.js';
import { planRequiresGate } from './recovery-strategy-planner.js';

export function initialRecoveryStates(): RecoveryState[] {
  return ['RECOVERY_INPUT_RECEIVED'];
}

export function advanceAfterVerificationRead(states: RecoveryState[]): RecoveryState[] {
  return [...states, 'VERIFICATION_RESULT_READ'];
}

export function advanceAfterNeedClassified(states: RecoveryState[]): RecoveryState[] {
  return [...states, 'RECOVERY_NEED_CLASSIFIED'];
}

export function advanceAfterStrategySelected(states: RecoveryState[]): RecoveryState[] {
  return [...states, 'RECOVERY_STRATEGY_SELECTED'];
}

export function advanceAfterGatesChecked(states: RecoveryState[]): RecoveryState[] {
  return [...states, 'RECOVERY_GATES_CHECKED'];
}

export function finalizeRecoveryStates(plan: RecoveryPlan): RecoveryState[] {
  const states: RecoveryState[] = [
    'RECOVERY_INPUT_RECEIVED',
    'VERIFICATION_RESULT_READ',
    'RECOVERY_NEED_CLASSIFIED',
    'RECOVERY_STRATEGY_SELECTED',
    'RECOVERY_GATES_CHECKED',
    'RECOVERY_PLAN_CREATED',
  ];

  if (plan.recoveryNeed === 'NO_RECOVERY_REQUIRED') {
    states.push('RECOVERY_NOT_REQUIRED');
  } else if (planRequiresGate(plan) || plan.recoveryNeed === 'BLOCKED_REQUIRES_FUTURE_GATE') {
    states.push('RECOVERY_BLOCKED_PENDING_GATE');
  }

  states.push('RECOVERY_RECORD_CREATED');
  return states;
}

export function recoveryStateIncludes(states: RecoveryState[], target: RecoveryState): boolean {
  return states.includes(target);
}

export function createRecoveryRecordId(): string {
  return `recovery-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
