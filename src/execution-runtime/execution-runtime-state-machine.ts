/**
 * Execution runtime state machine — deterministic state transitions only.
 */

import type { ExecutionDecision } from '../execution-authority/types.js';
import type { PackageValidationResult } from './types.js';
import type { RuntimeDecision, RuntimeRecord, RuntimeState } from './types.js';
import { mapClassificationToFutureGate } from './types.js';

function createRecordId(): string {
  return `runtime-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function initialRuntimeStates(): RuntimeState[] {
  return ['PACKAGE_RECEIVED'];
}

export function advanceAfterSchemaValidation(
  states: RuntimeState[],
  validation: PackageValidationResult,
): RuntimeState[] {
  const next = [...states];
  if (validation.valid) {
    next.push('SCHEMA_VALIDATED');
  } else {
    next.push('REJECTED_INVALID_PACKAGE');
  }
  return next;
}

export function advanceAfterAuthorityCheck(states: RuntimeState[]): RuntimeState[] {
  return [...states, 'AUTHORITY_CHECKED'];
}

export function buildRuntimeDecision(
  authorityDecision: ExecutionDecision,
): RuntimeDecision {
  if (authorityDecision.allowed && authorityDecision.classification === 'READ_ONLY') {
    return {
      accepted: true,
      finalState: 'ACCEPTED_READ_ONLY',
      classification: authorityDecision.classification,
      noExecutionConfirmed: true,
    };
  }

  const futureGate =
    mapClassificationToFutureGate(authorityDecision.classification) ??
    authorityDecision.requiredFutureGate;

  return {
    accepted: false,
    finalState: 'BLOCKED_REQUIRES_GATE',
    classification: authorityDecision.classification,
    blockedReason: authorityDecision.reason,
    futureGateRequired: futureGate,
    noExecutionConfirmed: true,
  };
}

export function finalizeRuntimeStates(
  states: RuntimeState[],
  runtimeDecision: RuntimeDecision,
  schemaValid: boolean,
): RuntimeState[] {
  const next = [...states];
  if (!schemaValid) {
    if (!next.includes('REJECTED_INVALID_PACKAGE')) {
      next.push('REJECTED_INVALID_PACKAGE');
    }
  } else {
    next.push(runtimeDecision.finalState);
  }
  next.push('RUNTIME_RECORD_CREATED');
  return next;
}

export function createRuntimeRecord(
  pkg: import('./types.js').ExecutionPackage,
  stateSequence: RuntimeState[],
  authorityDecision: ExecutionDecision | null,
  runtimeDecision: RuntimeDecision,
  warnings: string[],
  errors: string[],
): RuntimeRecord {
  return {
    recordId: createRecordId(),
    packageId: pkg.packageId,
    createdAt: Date.now(),
    stateSequence: [...stateSequence],
    authorityDecision: authorityDecision
      ? {
          ...authorityDecision,
          warnings: [...authorityDecision.warnings],
          errors: [...authorityDecision.errors],
        }
      : null,
    runtimeDecision: { ...runtimeDecision },
    package: { ...pkg, metadata: { ...pkg.metadata } },
    warnings: [...warnings],
    errors: [...errors],
  };
}

export function stateSequenceIncludes(states: RuntimeState[], target: RuntimeState): boolean {
  return states.includes(target);
}
