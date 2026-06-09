/**
 * Execution state machine — foundation states only, no action transitions.
 */

import type { ExecutionReadinessReport, ExecutionState } from './execution-runtime-types.js';

const VALID_TRANSITIONS: Readonly<Record<ExecutionState, readonly ExecutionState[]>> = {
  NOT_READY: ['READINESS_CHECK', 'BLOCKED'],
  READINESS_CHECK: ['READY', 'BLOCKED', 'WAITING_APPROVAL', 'SIMULATION_ONLY'],
  READY: ['WAITING_APPROVAL', 'SIMULATION_ONLY', 'COMPLETED'],
  BLOCKED: ['READINESS_CHECK', 'NOT_READY'],
  WAITING_APPROVAL: ['SIMULATION_ONLY', 'BLOCKED', 'READY'],
  SIMULATION_ONLY: ['READINESS_CHECK', 'COMPLETED', 'BLOCKED'],
  COMPLETED: [],
};

export function initialExecutionState(): ExecutionState {
  return 'NOT_READY';
}

export function canTransition(from: ExecutionState, to: ExecutionState): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function resolveStateFromReadiness(readiness: ExecutionReadinessReport): ExecutionState {
  if (readiness.safetyStatus === 'FORBIDDEN' || readiness.safetyStatus === 'BLOCKED') {
    return 'BLOCKED';
  }
  if (readiness.blockers.length > 0) {
    return 'BLOCKED';
  }
  if (readiness.approvalRequired.length > 0) {
    return 'WAITING_APPROVAL';
  }
  if (!readiness.executionAllowed) {
    return 'SIMULATION_ONLY';
  }
  if (readiness.readinessScore >= 70) {
    return 'READY';
  }
  if (readiness.readinessScore > 0) {
    return 'READINESS_CHECK';
  }
  return 'NOT_READY';
}

export function advanceExecutionState(
  current: ExecutionState,
  readiness: ExecutionReadinessReport,
): ExecutionState {
  const target = resolveStateFromReadiness(readiness);
  if (canTransition(current, target)) return target;
  if (current === 'NOT_READY' && target !== 'NOT_READY') return 'READINESS_CHECK';
  return current;
}

export function stateSequenceForEvaluation(): ExecutionState[] {
  return ['NOT_READY', 'READINESS_CHECK', 'SIMULATION_ONLY'];
}

export function isTerminalState(state: ExecutionState): boolean {
  return state === 'COMPLETED' || state === 'BLOCKED';
}

export function statesAllowFoundationOnly(_state: ExecutionState): boolean {
  return true;
}
