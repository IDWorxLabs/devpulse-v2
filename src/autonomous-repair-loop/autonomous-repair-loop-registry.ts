/**
 * Autonomous Repair Loop — constants, budgets, and action registry.
 */

import type { RepairLoopAction, RepairLoopSeverity, RepairLoopState } from './autonomous-repair-loop-types.js';

export const AUTONOMOUS_REPAIR_LOOP_PASS_TOKEN = 'AUTONOMOUS_REPAIR_LOOP_PASS';
export const AUTONOMOUS_REPAIR_LOOP_OWNER_MODULE = 'devpulse_autonomous_repair_loop';
export const AUTONOMOUS_REPAIR_LOOP_PHASE = 'Phase 24H — Autonomous Repair Loop Foundation';
export const AUTONOMOUS_REPAIR_LOOP_REPORT_TITLE = 'AUTONOMOUS_REPAIR_LOOP_REPORT';
export const AUTONOMOUS_REPAIR_LOOP_CACHE_KEY_PREFIX = 'autonomous-repair-loop-v1';
export const MAX_REPAIR_LOOP_HISTORY = 16;
export const MAX_REPAIR_LOOP_ATTEMPTS = 8;
export const MAX_ESCALATION_SUGGESTIONS = 8;

export const REPAIR_LOOP_CORE_QUESTION = 'After a finding exists: what should happen next?';

export const REPAIR_LOOP_ACTIONS: readonly RepairLoopAction[] = [
  'RETRY_FIX',
  'APPLY_DIFFERENT_FIX',
  'RETEST',
  'ACCEPT_FIX',
  'REVERT_FIX',
  'ESCALATE',
  'STOP',
] as const;

export const REPAIR_LOOP_STATES: readonly RepairLoopState[] = [
  'IDLE',
  'FINDING_DETECTED',
  'FIX_PROPOSED',
  'PROOF_PENDING',
  'PROOF_COMPLETE',
  'ACCEPTANCE_PENDING',
  'ACCEPTED',
  'FAILED',
  'ESCALATED',
  'STOPPED',
] as const;

export const ATTEMPT_BUDGET_BY_SEVERITY: Record<RepairLoopSeverity, number> = {
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  CRITICAL: 5,
};

export function getAttemptBudgetForSeverity(severity: RepairLoopSeverity): number {
  return ATTEMPT_BUDGET_BY_SEVERITY[severity];
}

export function isRepairLoopAction(value: string): value is RepairLoopAction {
  return (REPAIR_LOOP_ACTIONS as readonly string[]).includes(value);
}

export function isRepairLoopState(value: string): value is RepairLoopState {
  return (REPAIR_LOOP_STATES as readonly string[]).includes(value);
}
