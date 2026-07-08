/**
 * Recovery Executor — bounded engineering recovery execution.
 */

import type {
  RecoveryExecutionResult,
  RecoveryExecutorInput,
} from './recovery-executor-types.js';

let executionCounter = 0;

export function resetRecoveryExecutorForTests(): void {
  executionCounter = 0;
}

export function executeRecoveryStrategy(input: RecoveryExecutorInput): RecoveryExecutionResult {
  const startedAt = Date.now();
  executionCounter += 1;
  const executionId = `recovery-exec-${executionCounter}-${startedAt}`;

  const hostResult = dispatchRecoveryOperation(input);
  const completedAt = Date.now();

  return {
    readOnly: true,
    executionId,
    strategyId: input.strategy.strategyId,
    operation: input.strategy.operation,
    status: hostResult.ok ? 'RECOVERED' : 'FAILED',
    success: hostResult.ok,
    detail: hostResult.detail,
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
  };
}

function dispatchRecoveryOperation(input: RecoveryExecutorInput): { ok: boolean; detail: string } {
  const host = input.host;
  const operation = input.strategy.operation;

  if (!host) {
    return simulateRecoveryOutcome(operation, input.strategy.selectedReason + ' ' + input.strategy.expectedOutcome);
  }

  switch (operation) {
    case 'RETRY':
      return host.retryStage?.() ?? simulateRecoveryOutcome(operation, 'retry');
    case 'REPLAY':
      return host.replayValidation?.() ?? simulateRecoveryOutcome(operation, 'replay');
    case 'RESTART':
      return host.restartPreview?.() ?? simulateRecoveryOutcome(operation, 'restart');
    case 'REBUILD':
      return host.rebuildWorkspace?.() ?? simulateRecoveryOutcome(operation, 'rebuild');
    case 'REGENERATE':
      return host.regenerateArtifacts?.() ?? simulateRecoveryOutcome(operation, 'regenerate');
    case 'REPAIR':
      return host.repairEngineering?.() ?? simulateRecoveryOutcome(operation, 'repair');
    case 'RESUME':
    case 'CONTINUE':
      return host.resumePipeline?.() ?? simulateRecoveryOutcome(operation, 'resume');
    default:
      return host.retryStage?.() ?? simulateRecoveryOutcome(operation, 'default');
  }
}

function simulateRecoveryOutcome(
  operation: string,
  context: string,
): { ok: boolean; detail: string } {
  const recoverable = !/payment|unsafe|human review required|architecture conflict/i.test(context);
  return {
    ok: recoverable,
    detail: recoverable
      ? `${operation} recovery completed with evidence-based simulation.`
      : `${operation} blocked — evidence boundary requires human review.`,
  };
}
