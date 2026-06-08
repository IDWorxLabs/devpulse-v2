/**
 * Recovery chain builder — generates ordered recovery step plans from failure types.
 * Planning only. No execution.
 */

import { buildRecoveryStep } from './recovery-step-classifier.js';
import type { ChainState, FailureType, RecoveryChainGovernanceContext, RecoveryStep } from './types.js';

const FAILURE_REASONS: Record<FailureType, string> = {
  MISSING_RUNTIME: 'Runtime record missing from governance chain',
  MISSING_APPROVAL: 'Required founder approval missing or pending',
  FAILED_VERIFICATION: 'Verification loop returned FAILED verdict',
  WRONG_GATE_MAPPING: 'Runtime and authority gate mapping conflict detected',
  AUTONOMY_FAILURE: 'Autonomy-related failure requires escalation',
  MONITOR_ONLY: 'Non-critical condition — monitor and verify only',
};

export function resolveFailureType(context: RecoveryChainGovernanceContext): FailureType {
  if (context.failureType) {
    return context.failureType;
  }

  if (!context.runtimeRecord) {
    return 'MISSING_RUNTIME';
  }

  if (context.verificationResult?.verdict === 'FAILED') {
    return 'FAILED_VERIFICATION';
  }

  const pkg = context.runtimeRecord.package;
  if (pkg.requiresAutonomy || context.approvalRecord?.approvalRequirement === 'APPROVAL_REQUIRED_AUTONOMY') {
    return 'AUTONOMY_FAILURE';
  }

  if (
    context.runtimeRecord.runtimeDecision.accepted === true &&
    context.runtimeRecord.authorityDecision?.allowed === false
  ) {
    return 'WRONG_GATE_MAPPING';
  }

  const approvalMissing = !context.approvalRecord;
  const approvalPending = context.approvalRecord?.decision === 'PENDING';

  if (approvalMissing || approvalPending) {
    return 'MISSING_APPROVAL';
  }

  if (context.realityResult?.verdict === 'REALITY_WARNING') {
    return 'MONITOR_ONLY';
  }

  return 'MONITOR_ONLY';
}

export function resolveFailureReason(context: RecoveryChainGovernanceContext, failureType: FailureType): string {
  return context.failureReason ?? FAILURE_REASONS[failureType];
}

export function buildRecoveryStepsForFailure(
  failureType: FailureType,
  context: RecoveryChainGovernanceContext,
): RecoveryStep[] {
  switch (failureType) {
    case 'MISSING_RUNTIME':
      return [buildRecoveryStep(1, 'INVESTIGATE'), buildRecoveryStep(2, 'VERIFY')];

    case 'MISSING_APPROVAL':
      return [
        buildRecoveryStep(1, 'REQUEST_APPROVAL'),
        buildRecoveryStep(2, 'WAIT_FOR_GATE'),
        buildRecoveryStep(3, 'VERIFY'),
      ];

    case 'FAILED_VERIFICATION': {
      const steps = [buildRecoveryStep(1, 'INVESTIGATE'), buildRecoveryStep(2, 'RETRY')];
      if (
        context.rollbackRequired === true ||
        context.recoveryRecord?.plan.rollbackRequired === true
      ) {
        steps.push(buildRecoveryStep(steps.length + 1, 'ROLLBACK'));
      }
      steps.push(buildRecoveryStep(steps.length + 1, 'VERIFY'));
      return steps;
    }

    case 'WRONG_GATE_MAPPING':
      return [
        buildRecoveryStep(1, 'INVESTIGATE'),
        buildRecoveryStep(2, 'REQUEST_APPROVAL'),
        buildRecoveryStep(3, 'VERIFY'),
      ];

    case 'AUTONOMY_FAILURE':
      return [
        buildRecoveryStep(1, 'ESCALATE'),
        buildRecoveryStep(2, 'REQUEST_APPROVAL'),
        buildRecoveryStep(3, 'WAIT_FOR_GATE'),
        buildRecoveryStep(4, 'VERIFY'),
      ];

    case 'MONITOR_ONLY':
    default:
      return [buildRecoveryStep(1, 'MONITOR'), buildRecoveryStep(2, 'VERIFY')];
  }
}

export function buildChainStateSequence(): ChainState[] {
  return [
    'CHAIN_INPUT_RECEIVED',
    'FAILURE_ANALYZED',
    'CHAIN_GENERATED',
    'CHAIN_VALIDATED',
    'RISK_EVALUATED',
    'EVIDENCE_ATTACHED',
    'CHAIN_READY',
  ];
}

function createChainId(): string {
  return `recovery-chain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export { createChainId };
