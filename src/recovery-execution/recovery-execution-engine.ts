/**
 * DevPulse V2 Recovery Execution Engine — recovery planning only.
 * Does NOT execute commands, modify files, apply changes, or perform recovery.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { formatRecoveryExecutionReport } from './recovery-execution-report.js';
import { buildRecoveryPlan } from './recovery-strategy-planner.js';
import {
  createRecoveryRecordId,
  finalizeRecoveryStates,
  recoveryStateIncludes,
} from './recovery-state-machine.js';
import {
  assertExecutionAuthorityDependency,
  assertExecutionRuntimeDependency,
  assertRecoveryDoesNotDuplicateVerification,
  assertVerificationLoopDependency,
  getVerificationResultForRecovery,
} from './recovery-verification-bridge.js';
import type { ExecutionVerificationResult } from '../execution-verification/types.js';
import type { RecoveryExecutionEngineState, RecoveryRecord } from './types.js';
import { RECOVERY_EXECUTION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2RecoveryExecutionEngine | null = null;

function createEngineId(): string {
  return `recovery-engine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneVerificationResult(
  result: ExecutionVerificationResult,
): ExecutionVerificationResult {
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
          package: {
            ...result.runtimeRecord.package,
            metadata: { ...result.runtimeRecord.package.metadata },
          },
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

function cloneRecord(record: RecoveryRecord): RecoveryRecord {
  return {
    ...record,
    stateSequence: [...record.stateSequence],
    plan: {
      ...record.plan,
      warnings: [...record.plan.warnings],
      errors: [...record.plan.errors],
    },
    verificationResult: cloneVerificationResult(record.verificationResult),
  };
}

export class DevPulseV2RecoveryExecutionEngine {
  private readonly engineId = createEngineId();
  private readonly records: RecoveryRecord[] = [];
  private engineWarnings: string[] = [
    'Recovery Execution Engine Foundation V1 — planning and governance only, no recovery executed.',
  ];
  private engineErrors: string[] = [];

  static readonly ownerModule = RECOVERY_EXECUTION_OWNER_MODULE;
  static readonly ownerDomain = 'recovery_execution_engine' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('recovery_execution_engine');
    return owner.ownerModule === RECOVERY_EXECUTION_OWNER_MODULE;
  }

  static assertDoesNotExecute(): boolean {
    const engine = new DevPulseV2RecoveryExecutionEngine();
    return (
      typeof (engine as { execute?: unknown }).execute === 'undefined' &&
      typeof (engine as { runRecovery?: unknown }).runRecovery === 'undefined' &&
      typeof (engine as { performRollback?: unknown }).performRollback === 'undefined'
    );
  }

  static assertDoesNotModifyFiles(): boolean {
    const engine = new DevPulseV2RecoveryExecutionEngine();
    return (
      typeof (engine as { writeFile?: unknown }).writeFile === 'undefined' &&
      typeof (engine as { applyPatch?: unknown }).applyPatch === 'undefined'
    );
  }

  static assertDependencyChain(): boolean {
    return (
      assertExecutionAuthorityDependency() &&
      assertExecutionRuntimeDependency() &&
      assertVerificationLoopDependency() &&
      getDevPulseV2Owner('execution_authority').phase === 6.1 &&
      getDevPulseV2Owner('execution_package_runtime').phase === 6.2 &&
      getDevPulseV2Owner('execution_verification_loop').phase === 6.3 &&
      getDevPulseV2Owner('recovery_execution_engine').phase === 6.4
    );
  }

  static assertDoesNotDuplicateVerification(): boolean {
    return assertRecoveryDoesNotDuplicateVerification();
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const recovery = getDevPulseV2Owner('recovery_execution_engine');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      recovery.ownerModule === RECOVERY_EXECUTION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  planRecovery(verificationResult: ExecutionVerificationResult): RecoveryRecord {
    const plan = buildRecoveryPlan(verificationResult);
    const stateSequence = finalizeRecoveryStates(plan);

    const record: RecoveryRecord = {
      recordId: createRecoveryRecordId(),
      plan,
      stateSequence,
      verificationResult: cloneVerificationResult(verificationResult),
      noRecoveryExecuted: true,
    };

    this.publishSummary(record);
    this.records.push(cloneRecord(record));
    return cloneRecord(record);
  }

  planRecoveryForPackage(packageId: string): RecoveryRecord | null {
    const verification = getVerificationResultForRecovery(packageId);
    if (!verification) {
      return null;
    }
    return this.planRecovery(verification);
  }

  getRecords(): RecoveryRecord[] {
    return this.records.map(cloneRecord);
  }

  getEngineState(): RecoveryExecutionEngineState {
    return {
      engineId: this.engineId,
      planCount: this.records.length,
      noRecoveryCount: this.records.filter((r) => r.plan.recoveryNeed === 'NO_RECOVERY_REQUIRED')
        .length,
      blockedPendingGateCount: this.records.filter((r) =>
        r.stateSequence.includes('RECOVERY_BLOCKED_PENDING_GATE'),
      ).length,
      recoveryPlanCount: this.records.filter(
        (r) => r.plan.recoveryNeed === 'FAILED_NEEDS_RECOVERY_PLAN',
      ).length,
      warnings: [...this.engineWarnings],
      errors: [...this.engineErrors],
    };
  }

  formatReport(): string {
    return formatRecoveryExecutionReport(this.getEngineState(), this.getRecords());
  }

  private publishSummary(record: RecoveryRecord): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Recovery plan: ${record.plan.strategy}`,
      summary: `Package ${record.plan.packageId} — ${record.plan.summary} No recovery executed.`,
      relatedEvidenceIds: [],
      relatedRecordId: record.recordId,
      status: record.plan.recoveryNeed === 'NO_RECOVERY_REQUIRED' ? 'INFO' : 'WARN',
      warnings: [...record.plan.warnings, 'Recovery planning only — no execution occurred.'],
      errors: [...record.plan.errors],
    });
  }
}

export function createDevPulseV2RecoveryExecutionEngine(): DevPulseV2RecoveryExecutionEngine {
  singleton = new DevPulseV2RecoveryExecutionEngine();
  return singleton;
}

export function getDevPulseV2RecoveryExecutionEngine(): DevPulseV2RecoveryExecutionEngine {
  if (!singleton) {
    singleton = new DevPulseV2RecoveryExecutionEngine();
  }
  return singleton;
}

export function resetDevPulseV2RecoveryExecutionEngineForTests(): DevPulseV2RecoveryExecutionEngine {
  singleton = new DevPulseV2RecoveryExecutionEngine();
  return singleton;
}

export { recoveryStateIncludes };
