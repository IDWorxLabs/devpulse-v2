/**
 * Execution verification checks — individual alignment and trust checks.
 */

import type { ExecutionDecision } from '../execution-authority/types.js';
import type { RuntimeRecord } from '../execution-runtime/types.js';
import { mapClassificationToFutureGate } from '../execution-runtime/types.js';
import type { VerificationCheckOutcome } from './types.js';

export interface VerificationCheckResult {
  checkId: string;
  passed: boolean;
  critical: boolean;
  message: string;
}

export function checkRuntimeRecordExists(record: RuntimeRecord | null): VerificationCheckResult {
  return {
    checkId: 'runtime_record_exists',
    passed: record !== null,
    critical: true,
    message: record ? `Runtime record found: ${record.recordId}` : 'Missing runtime record',
  };
}

export function checkAuthorityDecisionPresent(record: RuntimeRecord | null): VerificationCheckResult {
  if (!record) {
    return {
      checkId: 'authority_decision_present',
      passed: false,
      critical: true,
      message: 'Cannot check authority — no runtime record',
    };
  }

  if (record.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE') {
    return {
      checkId: 'authority_decision_present',
      passed: true,
      critical: false,
      message: 'Authority not required for rejected invalid package',
    };
  }

  return {
    checkId: 'authority_decision_present',
    passed: record.authorityDecision !== null,
    critical: true,
    message: record.authorityDecision
      ? `Authority decision ${record.authorityDecision.decisionId}`
      : 'Missing authority decision for structurally valid package',
  };
}

export function checkAuthorityRuntimeAlignment(record: RuntimeRecord | null): VerificationCheckResult {
  if (!record?.authorityDecision) {
    return {
      checkId: 'authority_runtime_alignment',
      passed: false,
      critical: true,
      message: 'Cannot align — missing authority decision',
    };
  }

  const authority = record.authorityDecision;
  const runtime = record.runtimeDecision;

  if (runtime.finalState === 'REJECTED_INVALID_PACKAGE') {
    return {
      checkId: 'authority_runtime_alignment',
      passed: true,
      critical: true,
      message: 'Invalid package rejected before authority alignment required',
    };
  }

  const allowedMatches = runtime.accepted === authority.allowed;
  const classMatches =
    runtime.classification === authority.classification ||
    (runtime.classification === 'INVALID' && !authority.allowed);

  const acceptedNonReadOnly =
    runtime.accepted &&
    authority.classification !== 'READ_ONLY';

  if (acceptedNonReadOnly) {
    return {
      checkId: 'authority_runtime_alignment',
      passed: false,
      critical: true,
      message: `Runtime accepted non-read-only classification: ${authority.classification}`,
    };
  }

  return {
    checkId: 'authority_runtime_alignment',
    passed: allowedMatches && classMatches && !acceptedNonReadOnly,
    critical: true,
    message: `allowedMatch=${allowedMatches} classMatch=${classMatches}`,
  };
}

export function checkFutureGateAlignment(record: RuntimeRecord | null): VerificationCheckResult {
  if (!record?.authorityDecision) {
    return {
      checkId: 'future_gate_alignment',
      passed: true,
      critical: false,
      message: 'Gate check skipped — no authority decision',
    };
  }

  const authority = record.authorityDecision;
  if (authority.allowed || record.runtimeDecision.finalState !== 'BLOCKED_REQUIRES_GATE') {
    return {
      checkId: 'future_gate_alignment',
      passed: true,
      critical: true,
      message: 'Future gate not required for allowed package',
    };
  }

  const expected = mapClassificationToFutureGate(authority.classification);
  const actual = record.runtimeDecision.futureGateRequired;
  return {
    checkId: 'future_gate_alignment',
    passed: expected !== undefined && actual === expected,
    critical: true,
    message: `expected=${expected ?? 'none'} actual=${actual ?? 'missing'}`,
  };
}

export function checkNoExecutionConfirmed(record: RuntimeRecord | null): VerificationCheckResult {
  if (!record) {
    return {
      checkId: 'no_execution_confirmed',
      passed: false,
      critical: true,
      message: 'Cannot confirm — no runtime record',
    };
  }

  return {
    checkId: 'no_execution_confirmed',
    passed: record.runtimeDecision.noExecutionConfirmed === true,
    critical: true,
    message: `noExecutionConfirmed=${record.runtimeDecision.noExecutionConfirmed}`,
  };
}

export function runAllVerificationChecks(record: RuntimeRecord | null): VerificationCheckResult[] {
  return [
    checkRuntimeRecordExists(record),
    checkAuthorityDecisionPresent(record),
    checkAuthorityRuntimeAlignment(record),
    checkFutureGateAlignment(record),
    checkNoExecutionConfirmed(record),
  ];
}

export function checksToOutcome(checks: VerificationCheckResult[]): VerificationCheckOutcome {
  const failures = checks.filter((c) => !c.passed && c.critical).map((c) => c.message);
  const warnings = checks.filter((c) => !c.passed && !c.critical).map((c) => c.message);
  return { failures, warnings };
}

export function authorityFromRecord(record: RuntimeRecord | null): ExecutionDecision | null {
  return record?.authorityDecision ?? null;
}
