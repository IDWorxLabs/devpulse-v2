/**
 * DevPulse V2 Execution Package Runtime — controlled package intake and governance records.
 * Does NOT execute commands, modify files, run shell actions, apply changes, or perform recovery.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { resetDevPulseV2ExecutionAuthorityForTests } from '../execution-authority/index.js';
import {
  assertCentralBrainOwnershipUnchanged,
  assertExecutionAuthorityOwnershipUnchanged,
  assertRuntimeDoesNotDuplicateExecutionAuthority,
  assertTimelineLedgerOwnershipUnchanged,
  checkPackageWithExecutionAuthority,
  publishRuntimeSummary,
  recordRuntimeDecisionTimelineEvent,
} from './execution-runtime-authority-bridge.js';
import { normalizePackage } from './execution-package-schema.js';
import { validateExecutionPackage } from './execution-package-validator.js';
import { formatExecutionPackageRuntimeReport } from './execution-runtime-report.js';
import {
  advanceAfterAuthorityCheck,
  advanceAfterSchemaValidation,
  buildRuntimeDecision,
  createRuntimeRecord,
  finalizeRuntimeStates,
  initialRuntimeStates,
} from './execution-runtime-state-machine.js';
import type {
  ExecutionPackage,
  ExecutionPackageRuntimeState,
  RuntimeDecision,
  RuntimeRecord,
} from './types.js';
import { RUNTIME_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2ExecutionPackageRuntime | null = null;

function createRuntimeId(): string {
  return `execution-runtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneRecord(record: RuntimeRecord): RuntimeRecord {
  return {
    ...record,
    stateSequence: [...record.stateSequence],
    warnings: [...record.warnings],
    errors: [...record.errors],
    package: { ...record.package, metadata: { ...record.package.metadata } },
    runtimeDecision: { ...record.runtimeDecision },
    authorityDecision: record.authorityDecision
      ? {
          ...record.authorityDecision,
          warnings: [...record.authorityDecision.warnings],
          errors: [...record.authorityDecision.errors],
        }
      : null,
  };
}

export function createReadOnlyPackage(
  overrides: Partial<ExecutionPackage> = {},
): ExecutionPackage {
  return normalizePackage({
    packageId: 'pkg-readonly-001',
    requestedBy: 'test_system',
    requestText: 'read timeline events',
    executionIntent: 'observe',
    targetDomain: 'timeline_event_ledger',
    requestedAction: 'read',
    riskLevel: 'LOW',
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    metadata: {},
    ...overrides,
  });
}

export class DevPulseV2ExecutionPackageRuntime {
  private readonly runtimeId = createRuntimeId();
  private readonly records: RuntimeRecord[] = [];
  private runtimeWarnings: string[] = [
    'Execution Package Runtime Foundation V1 — package intake and governance only. No execution performed.',
  ];
  private runtimeErrors: string[] = [];

  static readonly ownerModule = RUNTIME_OWNER_MODULE;
  static readonly ownerDomain = 'execution_package_runtime' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('execution_package_runtime');
    return owner.ownerModule === RUNTIME_OWNER_MODULE;
  }

  static assertDoesNotExecute(): boolean {
    const runtime = new DevPulseV2ExecutionPackageRuntime();
    return (
      typeof (runtime as { execute?: unknown }).execute === 'undefined' &&
      typeof (runtime as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (runtime as { runShell?: unknown }).runShell === 'undefined'
    );
  }

  static assertDoesNotModifyFiles(): boolean {
    const runtime = new DevPulseV2ExecutionPackageRuntime();
    return (
      typeof (runtime as { writeFile?: unknown }).writeFile === 'undefined' &&
      typeof (runtime as { applyPatch?: unknown }).applyPatch === 'undefined' &&
      typeof (runtime as { modifyProject?: unknown }).modifyProject === 'undefined'
    );
  }

  static assertDoesNotDuplicateExecutionAuthority(): boolean {
    return (
      assertExecutionAuthorityOwnershipUnchanged() &&
      assertRuntimeDoesNotDuplicateExecutionAuthority() &&
      getDevPulseV2Owner('execution_authority').ownerModule !== RUNTIME_OWNER_MODULE
    );
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const runtime = getDevPulseV2Owner('execution_package_runtime');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      runtime.ownerModule === RUNTIME_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  processPackage(input: ExecutionPackage): RuntimeRecord {
    const pkg = normalizePackage(input);
    let states = initialRuntimeStates();
    const validation = validateExecutionPackage(pkg);
    states = advanceAfterSchemaValidation(states, validation);

    let authorityDecision = null;
    let runtimeDecision: RuntimeDecision;

    if (!validation.valid) {
      runtimeDecision = {
        accepted: false,
        finalState: 'REJECTED_INVALID_PACKAGE',
        classification: 'INVALID',
        blockedReason: validation.errors.join('; '),
        noExecutionConfirmed: true,
      };
      states = finalizeRuntimeStates(states, runtimeDecision, false);
    } else {
      authorityDecision = checkPackageWithExecutionAuthority(pkg);
      states = advanceAfterAuthorityCheck(states);
      runtimeDecision = buildRuntimeDecision(authorityDecision);
      states = finalizeRuntimeStates(states, runtimeDecision, true);
    }

    const record = createRuntimeRecord(
      pkg,
      states,
      authorityDecision,
      runtimeDecision,
      [...validation.warnings, ...this.runtimeWarnings],
      [...validation.errors, ...this.runtimeErrors],
    );

    publishRuntimeSummary(record);
    recordRuntimeDecisionTimelineEvent(record);
    this.records.push(cloneRecord(record));
    return cloneRecord(record);
  }

  getRecords(): RuntimeRecord[] {
    return this.records.map(cloneRecord);
  }

  getRecord(packageId: string): RuntimeRecord | null {
    const found = this.records.find((r) => r.packageId === packageId);
    return found ? cloneRecord(found) : null;
  }

  getRuntimeState(): ExecutionPackageRuntimeState {
    return {
      runtimeId: this.runtimeId,
      recordCount: this.records.length,
      acceptedReadOnlyCount: this.records.filter((r) => r.runtimeDecision.finalState === 'ACCEPTED_READ_ONLY')
        .length,
      blockedCount: this.records.filter((r) => r.runtimeDecision.finalState === 'BLOCKED_REQUIRES_GATE')
        .length,
      rejectedCount: this.records.filter(
        (r) => r.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE',
      ).length,
      warnings: [...this.runtimeWarnings],
      errors: [...this.runtimeErrors],
    };
  }

  formatReport(): string {
    return formatExecutionPackageRuntimeReport(this.getRuntimeState(), this.getRecords());
  }

  static assertBrainAndLedgerUnchanged(): boolean {
    return assertCentralBrainOwnershipUnchanged() && assertTimelineLedgerOwnershipUnchanged();
  }
}

export function createDevPulseV2ExecutionPackageRuntime(): DevPulseV2ExecutionPackageRuntime {
  singleton = new DevPulseV2ExecutionPackageRuntime();
  return singleton;
}

export function getDevPulseV2ExecutionPackageRuntime(): DevPulseV2ExecutionPackageRuntime {
  if (!singleton) {
    singleton = new DevPulseV2ExecutionPackageRuntime();
  }
  return singleton;
}

export function resetDevPulseV2ExecutionPackageRuntimeForTests(): DevPulseV2ExecutionPackageRuntime {
  resetDevPulseV2ExecutionAuthorityForTests();
  singleton = new DevPulseV2ExecutionPackageRuntime();
  return singleton;
}
