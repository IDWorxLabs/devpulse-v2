/**
 * Recovery strategy planner — selects safest strategy without executing recovery.
 */

import type { ExecutionVerificationResult } from '../execution-verification/types.js';
import { classifyRecoveryNeed } from './recovery-classifier.js';
import { mapVerificationToRequiredGate } from './recovery-gate-mapper.js';
import type { RecoveryNeedType, RecoveryPlan, RecoveryStrategyType } from './types.js';
import {
  GATE_FOUNDER_APPROVAL,
  GATE_WORLD2_AUTONOMY,
} from './types.js';

function createRecoveryPlanId(): string {
  return `recovery-plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function selectStrategyForFailed(result: ExecutionVerificationResult): RecoveryStrategyType {
  const failures = result.failures.join(' ');

  if (result.runtimeRecord === null || failures.includes('Missing runtime record')) {
    return 'MANUAL_INVESTIGATION_REQUIRED';
  }

  if (
    failures.includes('accepted non-read-only') ||
    failures.includes('Runtime accepted') ||
    failures.includes('Future gate') ||
    failures.includes('expected=') ||
    failures.includes('noExecutionConfirmed=false')
  ) {
    return 'FOUNDER_REVIEW_REQUIRED';
  }

  const classification = result.authorityDecision?.classification;
  if (classification === 'AUTONOMOUS_ACTION') {
    return 'WORLD2_ISOLATION_REQUIRED';
  }

  if (classification === 'RECOVERY_ACTION') {
    return 'ROLLBACK_AND_RETRY_AFTER_GATE';
  }

  return 'FOUNDER_REVIEW_REQUIRED';
}

export function selectRecoveryStrategy(
  result: ExecutionVerificationResult,
  need: RecoveryNeedType,
): RecoveryStrategyType {
  switch (need) {
    case 'NO_RECOVERY_REQUIRED':
      return 'NONE';
    case 'WARNING_MONITOR_ONLY':
      return 'MONITOR';
    case 'BLOCKED_REQUIRES_FUTURE_GATE':
      return 'RETRY_AFTER_GATE';
    case 'FAILED_NEEDS_RECOVERY_PLAN':
      return selectStrategyForFailed(result);
    case 'INVALID_INPUT':
      return 'MANUAL_INVESTIGATION_REQUIRED';
  }
}

export function buildRecoveryPlan(result: ExecutionVerificationResult): RecoveryPlan {
  const need = classifyRecoveryNeed(result);
  const strategy = selectRecoveryStrategy(result, need);
  const requiredGate = mapVerificationToRequiredGate(result);

  const rollbackRequired = strategy === 'ROLLBACK_AND_RETRY_AFTER_GATE';
  const retryAllowed =
    need === 'FAILED_NEEDS_RECOVERY_PLAN' &&
    (strategy === 'RETRY_AFTER_GATE' || strategy === 'ROLLBACK_AND_RETRY_AFTER_GATE');

  const founderApprovalRequired =
    strategy === 'FOUNDER_REVIEW_REQUIRED' ||
    strategy === 'WORLD2_ISOLATION_REQUIRED' ||
    requiredGate === GATE_FOUNDER_APPROVAL ||
    requiredGate === GATE_WORLD2_AUTONOMY;

  const warnings = [
    'Recovery Execution Engine — planning only, no recovery executed.',
  ];
  const errors: string[] = [];

  if (need === 'INVALID_INPUT') {
    errors.push('Invalid verification input — recovery plan limited to investigation.');
  }

  let summary = `Recovery need: ${need}, strategy: ${strategy}.`;
  if (requiredGate) {
    summary += ` Pending gate: ${requiredGate}.`;
  }
  if (founderApprovalRequired) {
    summary += ' Founder approval required before any recovery execution.';
  }

  return {
    recoveryPlanId: createRecoveryPlanId(),
    verificationId: result.verificationId,
    packageId: result.packageId,
    createdAt: Date.now(),
    verificationVerdict: result.verdict,
    recoveryNeed: need,
    strategy,
    requiredGate: strategy === 'NONE' || strategy === 'MONITOR' ? undefined : requiredGate,
    rollbackRequired,
    retryAllowed,
    founderApprovalRequired,
    summary,
    warnings,
    errors,
  };
}

export function planRequiresGate(plan: RecoveryPlan): boolean {
  return (
    plan.recoveryNeed === 'BLOCKED_REQUIRES_FUTURE_GATE' ||
    (plan.recoveryNeed === 'FAILED_NEEDS_RECOVERY_PLAN' && plan.requiredGate !== undefined)
  );
}
