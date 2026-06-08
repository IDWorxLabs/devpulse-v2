/**
 * Recovery gate mapper — maps verification/runtime context to required future gates.
 */

import type { ExecutionClassification } from '../execution-authority/types.js';
import type { ExecutionVerificationResult } from '../execution-verification/types.js';
import {
  GATE_EXECUTION_COMMAND,
  GATE_FOUNDER_APPROVAL,
  GATE_RECOVERY_EXECUTION,
  GATE_WORLD2_AUTONOMY,
} from './types.js';

export function mapClassificationToRecoveryGate(
  classification: ExecutionClassification | 'INVALID' | undefined,
): string | undefined {
  switch (classification) {
    case 'COMMAND_EXECUTION':
      return GATE_EXECUTION_COMMAND;
    case 'WRITE_OPERATION':
    case 'PROJECT_MODIFICATION':
      return GATE_FOUNDER_APPROVAL;
    case 'RECOVERY_ACTION':
      return GATE_RECOVERY_EXECUTION;
    case 'AUTONOMOUS_ACTION':
      return GATE_WORLD2_AUTONOMY;
    default:
      return undefined;
  }
}

export function mapBlockedRuntimeToGate(result: ExecutionVerificationResult): string | undefined {
  const classification =
    result.authorityDecision?.classification ??
    (result.runtimeDecision?.classification !== 'INVALID'
      ? result.runtimeDecision?.classification
      : undefined);

  const fromClass = mapClassificationToRecoveryGate(classification);
  if (fromClass) {
    return fromClass;
  }

  const fromRuntime = result.runtimeDecision?.futureGateRequired;
  if (fromRuntime === 'recovery_execution_engine') {
    return GATE_RECOVERY_EXECUTION;
  }
  return fromRuntime;
}

export function mapVerificationToRequiredGate(
  result: ExecutionVerificationResult,
): string | undefined {
  if (result.verdict === 'TRUSTED') {
    if (result.runtimeDecision?.finalState === 'BLOCKED_REQUIRES_GATE') {
      return mapBlockedRuntimeToGate(result);
    }
    return undefined;
  }

  if (result.verdict === 'WARNING') {
    return undefined;
  }

  if (result.verdict === 'FAILED') {
    const classification = result.authorityDecision?.classification ??
      result.runtimeDecision?.classification;

    if (classification && classification !== 'INVALID') {
      const gate = mapClassificationToRecoveryGate(classification);
      if (gate) return gate;
    }

    if (result.failures.some((f) => f.includes('Missing runtime record'))) {
      return undefined;
    }

    return GATE_FOUNDER_APPROVAL;
  }

  return undefined;
}

export {
  GATE_EXECUTION_COMMAND,
  GATE_FOUNDER_APPROVAL,
  GATE_RECOVERY_EXECUTION,
  GATE_WORLD2_AUTONOMY,
};
