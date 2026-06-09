/**
 * Recovery escalation engine — determines escalation level from failure context.
 */

import type { EscalationLevel, FailureCategory, RecoveryStrategy } from './types.js';
import { REPEATED_FAILURE_LIMIT } from './types.js';

export function evaluateEscalation(opts: {
  failureCategory: FailureCategory;
  failureCount: number;
  recoveryStrategy: RecoveryStrategy;
  founderApprovalRecorded: boolean;
  constitutionPassed: boolean;
  taskGovernorPassed: boolean;
}): { escalationLevel: EscalationLevel; escalationReason: string } {
  if (
    opts.failureCount >= REPEATED_FAILURE_LIMIT ||
    opts.failureCategory === 'REPEATED_FAILURE_LIMIT_REACHED' ||
    opts.recoveryStrategy === 'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL'
  ) {
    return {
      escalationLevel: 'SELF_EVOLUTION_REVIEW',
      escalationReason:
        'Repeated failure limit reached — same recovery strategy must not repeat after 3 failures; founder approval required before any future self-evolution action',
    };
  }

  if (opts.failureCategory === 'CONSTITUTION_BLOCKED' || !opts.constitutionPassed) {
    return {
      escalationLevel: 'CONSTITUTION',
      escalationReason: 'Constitutional enforcement gate must pass before recovery',
    };
  }

  if (opts.failureCategory === 'TASK_GOVERNOR_BLOCKED' || !opts.taskGovernorPassed) {
    return {
      escalationLevel: 'TASK_GOVERNOR',
      escalationReason: 'Task Governor scheduling required before recovery',
    };
  }

  if (
    opts.failureCategory === 'FOUNDER_APPROVAL_MISSING' ||
    !opts.founderApprovalRecorded ||
    opts.recoveryStrategy === 'REQUEST_FOUNDER_REVIEW_PROPOSAL'
  ) {
    return {
      escalationLevel: 'FOUNDER',
      escalationReason: 'Founder approval required before any future recovery action',
    };
  }

  if (
    opts.failureCategory === 'APPLY_FAILED' ||
    opts.failureCategory === 'ROLLBACK_FAILED' ||
    opts.failureCategory === 'VERIFY_FAILED'
  ) {
    return {
      escalationLevel: 'MULTI_GATE',
      escalationReason: 'Multi-gate approval required for apply/verify/rollback failure recovery',
    };
  }

  if (opts.failureCategory === 'WORKSPACE_ISOLATION_FAILED') {
    return {
      escalationLevel: 'MULTI_GATE',
      escalationReason: 'Workspace isolation failure requires multi-gate review',
    };
  }

  return {
    escalationLevel: 'NONE',
    escalationReason: 'No escalation required for low-severity failure context',
  };
}
