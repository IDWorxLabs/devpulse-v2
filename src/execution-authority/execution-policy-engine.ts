/**
 * Execution policy engine — allow read-only only; block all other execution classes.
 */

import {
  classifyExecutionRequest,
  isAutonomousAction,
  isCommandExecution,
  isProjectModification,
  isReadOnlyOperation,
  isRecoveryAction,
  isWriteOperation,
} from './execution-classifier.js';
import type { ExecutionClassification, ExecutionDecision, ExecutionRequest } from './types.js';
import {
  FUTURE_GATE_AUTONOMOUS,
  FUTURE_GATE_COMMAND,
  FUTURE_GATE_PROJECT_MODIFICATION,
  FUTURE_GATE_RECOVERY,
  FUTURE_GATE_WRITE,
} from './types.js';

function createDecisionId(): string {
  return `exec-decision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function requiredGateForClassification(classification: ExecutionClassification): string | undefined {
  switch (classification) {
    case 'COMMAND_EXECUTION':
      return FUTURE_GATE_COMMAND;
    case 'PROJECT_MODIFICATION':
      return FUTURE_GATE_PROJECT_MODIFICATION;
    case 'RECOVERY_ACTION':
      return FUTURE_GATE_RECOVERY;
    case 'AUTONOMOUS_ACTION':
      return FUTURE_GATE_AUTONOMOUS;
    case 'WRITE_OPERATION':
      return FUTURE_GATE_WRITE;
    default:
      return undefined;
  }
}

export function allowReadOnlyExecution(
  request: ExecutionRequest,
  classification: ExecutionClassification = 'READ_ONLY',
): ExecutionDecision {
  return {
    decisionId: createDecisionId(),
    createdAt: Date.now(),
    requestedBySystemId: request.requestedBySystemId,
    classification,
    allowed: true,
    reason: 'Read-only operation permitted under Execution Authority Foundation V1.',
    warnings: ['Execution Authority allows read-only governance only — no writes or commands.'],
    errors: [],
  };
}

export function blockUnsafeExecution(
  request: ExecutionRequest,
  classification: ExecutionClassification,
  reason: string,
): ExecutionDecision {
  const requiredFutureGate = requiredGateForClassification(classification);
  return {
    decisionId: createDecisionId(),
    createdAt: Date.now(),
    requestedBySystemId: request.requestedBySystemId,
    classification,
    allowed: false,
    reason,
    requiredFutureGate,
    warnings: [
      `Blocked until future gate${requiredFutureGate ? `: ${requiredFutureGate}` : ''}.`,
    ],
    errors: [`Execution blocked: ${classification} not permitted in Phase 6.1 foundation.`],
  };
}

export function evaluateExecutionRequest(request: ExecutionRequest): ExecutionDecision {
  const classification = classifyExecutionRequest(request.requestText);

  if (classification === 'READ_ONLY') {
    return allowReadOnlyExecution(request, classification);
  }

  if (classification === 'NO_EXECUTION') {
    return {
      decisionId: createDecisionId(),
      createdAt: Date.now(),
      requestedBySystemId: request.requestedBySystemId,
      classification,
      allowed: false,
      reason: 'Request does not match an allowed read-only operation pattern.',
      warnings: ['Classify as read-only (e.g. "read timeline events") for permitted access.'],
      errors: ['NO_EXECUTION — operation not classified as permitted read-only.'],
    };
  }

  const blockReasons: Record<
    Exclude<ExecutionClassification, 'READ_ONLY' | 'NO_EXECUTION'>,
    string
  > = {
    WRITE_OPERATION: 'Write operations require founder approval execution gate — not available yet.',
    COMMAND_EXECUTION: 'Command execution requires execution package runtime — not built yet.',
    PROJECT_MODIFICATION: 'Project modification requires founder approval execution gate — not available yet.',
    RECOVERY_ACTION: 'Recovery actions require recovery execution engine — not built yet.',
    AUTONOMOUS_ACTION: 'Autonomous actions require world2 isolation or autonomy gate — not available yet.',
  };

  return blockUnsafeExecution(
    request,
    classification,
    blockReasons[classification as keyof typeof blockReasons],
  );
}

export function summarizeExecutionDecision(decision: ExecutionDecision): string {
  const gate = decision.requiredFutureGate ? ` gate=${decision.requiredFutureGate}` : '';
  return (
    `Decision ${decision.decisionId}: ${decision.classification} ` +
    `${decision.allowed ? 'ALLOWED' : 'BLOCKED'} — ${decision.reason}${gate}`
  );
}

export {
  classifyExecutionRequest,
  isAutonomousAction,
  isCommandExecution,
  isProjectModification,
  isReadOnlyOperation,
  isRecoveryAction,
  isWriteOperation,
};
