/**
 * Execution verification evidence — structured claims supporting verification outcomes.
 */

import type { ExecutionDecision } from '../execution-authority/types.js';
import type { RuntimeRecord } from '../execution-runtime/types.js';
import {
  mapClassificationToFutureGate,
  RUNTIME_FUTURE_GATE_AUTONOMY,
  RUNTIME_FUTURE_GATE_COMMAND,
  RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL,
  RUNTIME_FUTURE_GATE_RECOVERY,
} from '../execution-runtime/types.js';
import type { VerificationEvidence } from './types.js';

let evidenceCounter = 0;

function createEvidenceId(): string {
  evidenceCounter += 1;
  return `exec-ver-evidence-${Date.now()}-${evidenceCounter}`;
}

export function resetVerificationEvidenceCounterForTests(): void {
  evidenceCounter = 0;
}

export function buildRuntimeRecordEvidence(record: RuntimeRecord): VerificationEvidence {
  return {
    evidenceId: createEvidenceId(),
    source: 'execution_package_runtime',
    claim: 'Runtime record exists for package',
    status: 'PASS',
    details: `recordId=${record.recordId} finalState=${record.runtimeDecision.finalState}`,
    critical: true,
  };
}

export function buildAuthorityEvidence(decision: ExecutionDecision): VerificationEvidence {
  return {
    evidenceId: createEvidenceId(),
    source: 'execution_authority',
    claim: 'Execution Authority decision recorded',
    status: 'PASS',
    details: `${decision.classification} allowed=${decision.allowed}`,
    critical: true,
  };
}

export function buildStateMachineEvidence(record: RuntimeRecord): VerificationEvidence {
  const complete = record.stateSequence.includes('RUNTIME_RECORD_CREATED');
  return {
    evidenceId: createEvidenceId(),
    source: 'runtime_state_machine',
    claim: 'Runtime state machine sequence captured',
    status: complete ? 'PASS' : 'WARN',
    details: record.stateSequence.join(' → '),
    critical: false,
  };
}

export function buildFutureGateEvidence(
  record: RuntimeRecord,
  authority: ExecutionDecision,
): VerificationEvidence {
  const expected = mapClassificationToFutureGate(authority.classification);
  if (!expected) {
    return {
      evidenceId: createEvidenceId(),
      source: 'future_gate_mapping',
      claim: 'Future gate not required for classification',
      status: 'INFO',
      details: `classification=${authority.classification}`,
      critical: false,
    };
  }

  const matches = record.runtimeDecision.futureGateRequired === expected;
  return {
    evidenceId: createEvidenceId(),
    source: 'future_gate_mapping',
    claim: 'Blocked package names correct future gate',
    status: matches ? 'PASS' : 'FAIL',
    details: `expected=${expected} actual=${record.runtimeDecision.futureGateRequired ?? 'missing'}`,
    critical: true,
  };
}

export function buildNoExecutionEvidence(record: RuntimeRecord): VerificationEvidence {
  return {
    evidenceId: createEvidenceId(),
    source: 'no_execution_confirmation',
    claim: 'Runtime confirms no execution occurred',
    status: record.runtimeDecision.noExecutionConfirmed ? 'PASS' : 'FAIL',
    details: `noExecutionConfirmed=${record.runtimeDecision.noExecutionConfirmed}`,
    critical: true,
  };
}

export function buildOptionalMetadataEvidence(record: RuntimeRecord): VerificationEvidence {
  const hasMetadata = Object.keys(record.package.metadata).length > 0;
  return {
    evidenceId: createEvidenceId(),
    source: 'execution_package_runtime',
    claim: 'Optional package metadata present',
    status: hasMetadata ? 'PASS' : 'WARN',
    details: hasMetadata ? 'metadata keys present' : 'metadata empty — non-critical',
    critical: false,
  };
}

export function summarizeEvidence(evidence: VerificationEvidence[]): string {
  const pass = evidence.filter((e) => e.status === 'PASS').length;
  const warn = evidence.filter((e) => e.status === 'WARN').length;
  const fail = evidence.filter((e) => e.status === 'FAIL').length;
  return `${evidence.length} evidence item(s): ${pass} PASS, ${warn} WARN, ${fail} FAIL`;
}

export {
  RUNTIME_FUTURE_GATE_AUTONOMY,
  RUNTIME_FUTURE_GATE_COMMAND,
  RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL,
  RUNTIME_FUTURE_GATE_RECOVERY,
};
