/**
 * Recovery classifier — determines recovery need from verification outcome.
 */

import type { ExecutionVerificationResult } from '../execution-verification/types.js';
import type { RecoveryNeedType } from './types.js';

function failureIndicatesAcceptedForbidden(result: ExecutionVerificationResult): boolean {
  return result.failures.some(
    (f) =>
      f.includes('accepted non-read-only') ||
      f.includes('Runtime accepted'),
  );
}

function failureIndicatesWrongGate(result: ExecutionVerificationResult): boolean {
  return result.failures.some(
    (f) =>
      f.includes('Future gate') ||
      f.includes('future gate') ||
      f.includes('expected='),
  );
}

function failureIndicatesMissingNoExecution(result: ExecutionVerificationResult): boolean {
  return result.failures.some(
    (f) =>
      f.includes('noExecutionConfirmed=false') ||
      f.includes('no execution'),
  );
}

function failureIndicatesMissingRecord(result: ExecutionVerificationResult): boolean {
  return (
    result.runtimeRecord === null ||
    result.failures.some((f) => f.includes('Missing runtime record'))
  );
}

export function classifyRecoveryNeed(
  result: ExecutionVerificationResult | null,
): RecoveryNeedType {
  if (!result) {
    return 'INVALID_INPUT';
  }

  if (result.verdict === 'TRUSTED') {
    const blocked =
      result.runtimeDecision?.finalState === 'BLOCKED_REQUIRES_GATE';
    if (blocked) {
      return 'BLOCKED_REQUIRES_FUTURE_GATE';
    }
    return 'NO_RECOVERY_REQUIRED';
  }

  if (result.verdict === 'WARNING') {
    return 'WARNING_MONITOR_ONLY';
  }

  if (result.verdict === 'FAILED') {
    if (failureIndicatesMissingRecord(result) && !failureIndicatesAcceptedForbidden(result)) {
      return 'FAILED_NEEDS_RECOVERY_PLAN';
    }
    return 'FAILED_NEEDS_RECOVERY_PLAN';
  }

  return 'INVALID_INPUT';
}

export function isRecoveryNeeded(need: RecoveryNeedType): boolean {
  return need !== 'NO_RECOVERY_REQUIRED' && need !== 'INVALID_INPUT';
}

export function describeRecoveryNeed(need: RecoveryNeedType): string {
  switch (need) {
    case 'NO_RECOVERY_REQUIRED':
      return 'Verification trusted — no recovery planning required.';
    case 'WARNING_MONITOR_ONLY':
      return 'Verification warning — monitor only, no recovery execution.';
    case 'FAILED_NEEDS_RECOVERY_PLAN':
      return 'Verification failed — recovery plan required before any action.';
    case 'BLOCKED_REQUIRES_FUTURE_GATE':
      return 'Package blocked pending future gate — recovery deferred.';
    case 'INVALID_INPUT':
      return 'Invalid verification input — cannot plan recovery.';
  }
}
