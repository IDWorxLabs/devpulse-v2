/**
 * DevPulse V2 Execution Verification Loop — verifies Phase 6.2 runtime outcomes.
 * Does NOT execute commands, modify files, apply changes, or perform recovery.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import type { RuntimeRecord } from '../execution-runtime/types.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import {
  buildAuthorityEvidence,
  buildFutureGateEvidence,
  buildNoExecutionEvidence,
  buildOptionalMetadataEvidence,
  buildRuntimeRecordEvidence,
  buildStateMachineEvidence,
  resetVerificationEvidenceCounterForTests,
  summarizeEvidence,
} from './execution-verification-evidence.js';
import {
  checksToOutcome,
  runAllVerificationChecks,
} from './execution-verification-checks.js';
import { formatExecutionVerificationReport } from './execution-verification-report.js';
import {
  assertExecutionAuthorityDependencyPresent,
  assertExecutionRuntimeOwnershipUnchanged,
  assertVerificationDoesNotDuplicateRuntime,
  getRuntimeRecordForVerification,
} from './execution-verification-runtime-bridge.js';
import type {
  ExecutionVerificationLoopState,
  ExecutionVerificationResult,
  VerificationEvidence,
  VerificationState,
  VerificationVerdict,
} from './types.js';
import { VERIFICATION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2ExecutionVerificationLoop | null = null;

function createVerificationId(): string {
  return `exec-verification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLoopId(): string {
  return `exec-ver-loop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneResult(result: ExecutionVerificationResult): ExecutionVerificationResult {
  return {
    ...result,
    stateSequence: [...result.stateSequence],
    evidence: result.evidence.map((e) => ({ ...e })),
    warnings: [...result.warnings],
    failures: [...result.failures],
    runtimeRecord: result.runtimeRecord
      ? {
          ...result.runtimeRecord,
          stateSequence: [...result.runtimeRecord.stateSequence],
          warnings: [...result.runtimeRecord.warnings],
          errors: [...result.runtimeRecord.errors],
          package: { ...result.runtimeRecord.package, metadata: { ...result.runtimeRecord.package.metadata } },
          runtimeDecision: { ...result.runtimeRecord.runtimeDecision },
          authorityDecision: result.runtimeRecord.authorityDecision
            ? {
                ...result.runtimeRecord.authorityDecision,
                warnings: [...result.runtimeRecord.authorityDecision.warnings],
                errors: [...result.runtimeRecord.authorityDecision.errors],
              }
            : null,
        }
      : null,
    runtimeDecision: result.runtimeDecision ? { ...result.runtimeDecision } : null,
    authorityDecision: result.authorityDecision
      ? {
          ...result.authorityDecision,
          warnings: [...result.authorityDecision.warnings],
          errors: [...result.authorityDecision.errors],
        }
      : null,
  };
}

export interface VerifyRuntimeOptions {
  includeOptionalEvidence?: boolean;
}

function determineVerdict(
  failures: string[],
  warnings: string[],
): VerificationVerdict {
  if (failures.length > 0) return 'FAILED';
  if (warnings.length > 0) return 'WARNING';
  return 'TRUSTED';
}

function determineConfidence(verdict: VerificationVerdict, evidence: VerificationEvidence[]): ExecutionVerificationResult['confidence'] {
  if (verdict === 'FAILED') return 'LOW';
  const criticalFails = evidence.filter((e) => e.critical && e.status === 'FAIL').length;
  if (criticalFails > 0 || verdict === 'WARNING') return 'MEDIUM';
  return 'HIGH';
}

function finalizeVerificationState(
  verdict: VerificationVerdict,
  states: VerificationState[],
): VerificationState[] {
  const next: VerificationState[] = [...states, 'EVIDENCE_ATTACHED'];
  if (verdict === 'TRUSTED') next.push('VERIFICATION_PASSED');
  else if (verdict === 'WARNING') next.push('VERIFICATION_WARNING');
  else next.push('VERIFICATION_FAILED');
  return next;
}

export function verifyRuntimeRecord(
  record: RuntimeRecord | null,
  packageId: string,
  options: VerifyRuntimeOptions = {},
): ExecutionVerificationResult {
  const includeOptional = options.includeOptionalEvidence !== false;
  const states: VerificationState[] = ['VERIFICATION_RECEIVED'];

  if (record) {
    states.push('RUNTIME_RECORD_FOUND');
  }

  const checks = runAllVerificationChecks(record);
  const { failures, warnings: checkWarnings } = checksToOutcome(checks);
  states.push('AUTHORITY_ALIGNMENT_CHECKED');
  states.push('GATE_ALIGNMENT_CHECKED');

  const noExecutionOk = record?.runtimeDecision.noExecutionConfirmed === true;
  if (noExecutionOk) {
    states.push('NO_EXECUTION_CONFIRMED');
  }

  const evidence: VerificationEvidence[] = [];
  if (record) {
    evidence.push(buildRuntimeRecordEvidence(record));
    if (record.authorityDecision) {
      evidence.push(buildAuthorityEvidence(record.authorityDecision));
      evidence.push(buildFutureGateEvidence(record, record.authorityDecision));
    }
    evidence.push(buildStateMachineEvidence(record));
    evidence.push(buildNoExecutionEvidence(record));
    if (includeOptional) {
      evidence.push(buildOptionalMetadataEvidence(record));
    }
  }

  const evidenceWarnings: string[] = [];
  for (const item of evidence) {
    if (item.status === 'FAIL' && item.critical) {
      failures.push(item.claim + ': ' + item.details);
    } else if (item.status === 'WARN' && !item.critical) {
      evidenceWarnings.push(item.claim + ': ' + item.details);
    }
  }

  const allWarnings = [
    'Execution Verification Loop — verification only, no execution performed.',
    ...checkWarnings,
    ...evidenceWarnings,
  ];

  const verdict = determineVerdict(failures, [...checkWarnings, ...evidenceWarnings]);
  const finalStates = finalizeVerificationState(verdict, states);

  return {
    verificationId: createVerificationId(),
    packageId,
    createdAt: Date.now(),
    runtimeRecord: record,
    runtimeDecision: record?.runtimeDecision ?? null,
    authorityDecision: record?.authorityDecision ?? null,
    verdict,
    confidence: determineConfidence(verdict, evidence),
    stateSequence: finalStates,
    evidence,
    warnings: allWarnings,
    failures,
    noExecutionConfirmedByLoop: true,
  };
}

export class DevPulseV2ExecutionVerificationLoop {
  private readonly loopId = createLoopId();
  private readonly results: ExecutionVerificationResult[] = [];
  private loopWarnings: string[] = [
    'Execution Verification Loop verifies runtime outcomes only — no commands, writes, or recovery.',
  ];
  private loopErrors: string[] = [];

  static readonly ownerModule = VERIFICATION_OWNER_MODULE;
  static readonly ownerDomain = 'execution_verification_loop' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('execution_verification_loop');
    return owner.ownerModule === VERIFICATION_OWNER_MODULE;
  }

  static assertDoesNotExecute(): boolean {
    const loop = new DevPulseV2ExecutionVerificationLoop();
    return (
      typeof (loop as { execute?: unknown }).execute === 'undefined' &&
      typeof (loop as { runCommand?: unknown }).runCommand === 'undefined'
    );
  }

  static assertDoesNotDuplicateRuntime(): boolean {
    return (
      assertExecutionRuntimeOwnershipUnchanged() &&
      assertVerificationDoesNotDuplicateRuntime()
    );
  }

  static assertDependencyChain(): boolean {
    return (
      assertExecutionAuthorityDependencyPresent() &&
      assertExecutionRuntimeOwnershipUnchanged() &&
      getDevPulseV2Owner('execution_authority').phase === 6.1 &&
      getDevPulseV2Owner('execution_package_runtime').phase === 6.2 &&
      getDevPulseV2Owner('execution_verification_loop').phase === 6.3
    );
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const verification = getDevPulseV2Owner('execution_verification_loop');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      verification.ownerModule === VERIFICATION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  verifyPackage(packageId: string, options?: VerifyRuntimeOptions): ExecutionVerificationResult {
    const record = getRuntimeRecordForVerification(packageId);
    const result = verifyRuntimeRecord(record, packageId, options);
    this.results.push(cloneResult(result));
    this.publishSummary(result);
    return cloneResult(result);
  }

  verifyRecord(record: RuntimeRecord | null, packageId: string, options?: VerifyRuntimeOptions): ExecutionVerificationResult {
    const result = verifyRuntimeRecord(record, packageId, options);
    this.results.push(cloneResult(result));
    this.publishSummary(result);
    return cloneResult(result);
  }

  getResults(): ExecutionVerificationResult[] {
    return this.results.map(cloneResult);
  }

  getLoopState(): ExecutionVerificationLoopState {
    return {
      loopId: this.loopId,
      verificationCount: this.results.length,
      trustedCount: this.results.filter((r) => r.verdict === 'TRUSTED').length,
      warningCount: this.results.filter((r) => r.verdict === 'WARNING').length,
      failedCount: this.results.filter((r) => r.verdict === 'FAILED').length,
      warnings: [...this.loopWarnings],
      errors: [...this.loopErrors],
    };
  }

  formatReport(): string {
    return formatExecutionVerificationReport(this.getLoopState(), this.getResults());
  }

  private publishSummary(result: ExecutionVerificationResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    const ledger = getDevPulseV2TimelineLedgerAuthority();
    ledger.addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Execution verification: ${result.verdict}`,
      summary: `Package ${result.packageId} — ${summarizeEvidence(result.evidence)}. Verification only, no execution.`,
      relatedEvidenceIds: result.evidence.map((e) => e.evidenceId),
      relatedRecordId: result.verificationId,
      status: result.verdict === 'TRUSTED' ? 'PASS' : result.verdict === 'WARNING' ? 'WARN' : 'FAIL',
      warnings: [...result.warnings],
      errors: [...result.failures],
    });
  }
}

export function createDevPulseV2ExecutionVerificationLoop(): DevPulseV2ExecutionVerificationLoop {
  singleton = new DevPulseV2ExecutionVerificationLoop();
  return singleton;
}

export function getDevPulseV2ExecutionVerificationLoop(): DevPulseV2ExecutionVerificationLoop {
  if (!singleton) {
    singleton = new DevPulseV2ExecutionVerificationLoop();
  }
  return singleton;
}

export function resetDevPulseV2ExecutionVerificationLoopForTests(): DevPulseV2ExecutionVerificationLoop {
  resetVerificationEvidenceCounterForTests();
  singleton = new DevPulseV2ExecutionVerificationLoop();
  return singleton;
}

export function verificationStateIncludes(
  states: VerificationState[],
  target: VerificationState,
): boolean {
  return states.includes(target);
}
