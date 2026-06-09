/**
 * Recovery strategy selector — maps failure category to proposal-only strategy.
 */

import type { FailureCategory, RecoveryStrategy } from './types.js';
import { REPEATED_FAILURE_LIMIT } from './types.js';

export function selectRecoveryStrategy(
  category: FailureCategory,
  failureCount: number,
  previousStrategies: RecoveryStrategy[],
): RecoveryStrategy {
  if (failureCount >= REPEATED_FAILURE_LIMIT || category === 'REPEATED_FAILURE_LIMIT_REACHED') {
    return 'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL';
  }

  const strategyMap: Record<FailureCategory, RecoveryStrategy> = {
    APPLY_FAILED: 'REBUILD_APPLY_PLAN_PROPOSAL',
    VERIFY_FAILED: 'CREATE_DIAGNOSTIC_REPORT_PROPOSAL',
    ROLLBACK_FAILED: 'REBUILD_ROLLBACK_PLAN_PROPOSAL',
    WORKSPACE_ISOLATION_FAILED: 'MARK_UNSAFE_AND_ABORT_PROPOSAL',
    TASK_GOVERNOR_BLOCKED: 'REQUEST_FOUNDER_REVIEW_PROPOSAL',
    FOUNDER_APPROVAL_MISSING: 'REQUEST_FOUNDER_REVIEW_PROPOSAL',
    CONSTITUTION_BLOCKED: 'STOP_AND_REPORT_PROPOSAL',
    RUNTIME_VERIFICATION_FAILED: 'CREATE_DIAGNOSTIC_REPORT_PROPOSAL',
    UNKNOWN_RUNTIME_FAILURE: 'STOP_AND_REPORT_PROPOSAL',
    REPEATED_FAILURE_LIMIT_REACHED: 'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL',
  };

  const candidate = strategyMap[category];

  if (previousStrategies.length >= REPEATED_FAILURE_LIMIT - 1) {
    const repeated = previousStrategies.filter((s) => s === candidate).length;
    if (repeated >= REPEATED_FAILURE_LIMIT - 1) {
      return 'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL';
    }
  }

  return candidate;
}

export function strategyWouldRepeat(
  strategy: RecoveryStrategy,
  previousStrategies: RecoveryStrategy[],
): boolean {
  if (previousStrategies.length < REPEATED_FAILURE_LIMIT - 1) return false;
  const sameCount = previousStrategies.filter((s) => s === strategy).length;
  return sameCount >= REPEATED_FAILURE_LIMIT - 1;
}
