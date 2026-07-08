/**
 * Autonomous Engineering Loop V1 — state machine.
 */

import type { AelDecision, AelState } from './ael-types.js';

const TERMINAL_STATES: ReadonlySet<AelState> = new Set([
  'AEL_LAUNCH_READY',
  'AEL_HUMAN_REVIEW_REQUIRED',
  'AEL_ENGINEERING_LIMIT_REACHED',
]);

const STATE_ORDER: readonly AelState[] = [
  'AEL_NOT_STARTED',
  'AEL_INITIAL_BUILD',
  'AEL_PRODUCT_REALITY_CHECK',
  'AEL_FOUNDER_SIMULATION',
  'AEL_CAPABILITY_GAP_ANALYSIS',
  'AEL_CAPABILITY_EVOLUTION',
  'AEL_AUTOFIX_REPAIR',
  'AEL_PREVIEW_RETRY',
  'AEL_REVALIDATION',
  'AEL_LAUNCH_READY',
  'AEL_HUMAN_REVIEW_REQUIRED',
  'AEL_ENGINEERING_LIMIT_REACHED',
];

export function isAelTerminalState(state: AelState): boolean {
  return TERMINAL_STATES.has(state);
}

export function resolveNextAelState(input: {
  current: AelState;
  decision: AelDecision;
}): AelState {
  switch (input.decision) {
    case 'DECLARE_LAUNCH_READY':
      return 'AEL_LAUNCH_READY';
    case 'REQUEST_HUMAN_REVIEW':
      return 'AEL_HUMAN_REVIEW_REQUIRED';
    case 'STOP_AT_ENGINEERING_LIMIT':
      return 'AEL_ENGINEERING_LIMIT_REACHED';
    case 'RUN_AUTOFIX':
      return 'AEL_AUTOFIX_REPAIR';
    case 'RUN_CAPABILITY_EVOLUTION':
      return 'AEL_CAPABILITY_EVOLUTION';
    case 'RUN_PREVIEW_RECOVERY':
      return 'AEL_PREVIEW_RETRY';
    case 'CONTINUE_LOOP':
      if (input.current === 'AEL_AUTOFIX_REPAIR' || input.current === 'AEL_CAPABILITY_EVOLUTION' || input.current === 'AEL_PREVIEW_RETRY') {
        return 'AEL_REVALIDATION';
      }
      if (input.current === 'AEL_REVALIDATION') {
        return 'AEL_PRODUCT_REALITY_CHECK';
      }
      if (input.current === 'AEL_PRODUCT_REALITY_CHECK') {
        return 'AEL_FOUNDER_SIMULATION';
      }
      if (input.current === 'AEL_FOUNDER_SIMULATION') {
        return 'AEL_CAPABILITY_GAP_ANALYSIS';
      }
      return 'AEL_PRODUCT_REALITY_CHECK';
    default:
      return input.current;
  }
}

export function aelStateLabel(state: AelState): string {
  return state.replace(/^AEL_/, '').replace(/_/g, ' ').toLowerCase();
}

export function listAelStates(): readonly AelState[] {
  return STATE_ORDER;
}

export function initialAelState(): AelState {
  return 'AEL_INITIAL_BUILD';
}

export function decisionToRepairState(decision: AelDecision): AelState | null {
  switch (decision) {
    case 'RUN_AUTOFIX':
      return 'AEL_AUTOFIX_REPAIR';
    case 'RUN_CAPABILITY_EVOLUTION':
      return 'AEL_CAPABILITY_EVOLUTION';
    case 'RUN_PREVIEW_RECOVERY':
      return 'AEL_PREVIEW_RETRY';
    default:
      return null;
  }
}
