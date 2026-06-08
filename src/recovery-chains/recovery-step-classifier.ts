/**
 * Recovery step classifier — maps step types to requirement flags.
 */

import type { RecoveryStep, RecoveryStepType } from './types.js';

function createStepId(): string {
  return `recovery-step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const STEP_DESCRIPTIONS: Record<RecoveryStepType, string> = {
  INVESTIGATE: 'Investigate root cause before any recovery action',
  VERIFY: 'Verify governance chain alignment after recovery planning step',
  REQUEST_APPROVAL: 'Request founder approval before proceeding',
  WAIT_FOR_GATE: 'Wait for required gate to unlock before next step',
  RETRY: 'Plan controlled retry after investigation (no execution)',
  ROLLBACK: 'Plan rollback path after failure (no execution)',
  MONITOR: 'Monitor situation and collect evidence only',
  ESCALATE: 'Escalate autonomy-related failure to founder review',
};

export function classifyStepRequirements(
  stepType: RecoveryStepType,
): Omit<RecoveryStep, 'stepId' | 'order' | 'stepType' | 'description'> {
  switch (stepType) {
    case 'REQUEST_APPROVAL':
      return {
        requiresApproval: true,
        requiresVerification: false,
        requiresRetry: false,
        requiresRollback: false,
      };
    case 'WAIT_FOR_GATE':
      return {
        requiresApproval: true,
        requiresVerification: false,
        requiresRetry: false,
        requiresRollback: false,
      };
    case 'VERIFY':
      return {
        requiresApproval: false,
        requiresVerification: true,
        requiresRetry: false,
        requiresRollback: false,
      };
    case 'RETRY':
      return {
        requiresApproval: false,
        requiresVerification: true,
        requiresRetry: true,
        requiresRollback: false,
      };
    case 'ROLLBACK':
      return {
        requiresApproval: false,
        requiresVerification: true,
        requiresRetry: false,
        requiresRollback: true,
      };
    case 'ESCALATE':
      return {
        requiresApproval: true,
        requiresVerification: false,
        requiresRetry: false,
        requiresRollback: false,
      };
    case 'MONITOR':
    case 'INVESTIGATE':
    default:
      return {
        requiresApproval: false,
        requiresVerification: false,
        requiresRetry: false,
        requiresRollback: false,
      };
  }
}

export function buildRecoveryStep(order: number, stepType: RecoveryStepType): RecoveryStep {
  const requirements = classifyStepRequirements(stepType);
  return {
    stepId: createStepId(),
    order,
    stepType,
    description: STEP_DESCRIPTIONS[stepType],
    ...requirements,
  };
}

export function chainIncludesStepType(steps: RecoveryStep[], stepType: RecoveryStepType): boolean {
  return steps.some((s) => s.stepType === stepType);
}

export function deriveChainFlags(steps: RecoveryStep[]): {
  approvalRequired: boolean;
  verificationRequired: boolean;
  retryRequired: boolean;
  rollbackRequired: boolean;
} {
  return {
    approvalRequired: steps.some((s) => s.requiresApproval),
    verificationRequired: steps.some((s) => s.requiresVerification),
    retryRequired: steps.some((s) => s.requiresRetry),
    rollbackRequired: steps.some((s) => s.requiresRollback),
  };
}
