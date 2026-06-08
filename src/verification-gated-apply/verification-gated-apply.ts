/**
 * DevPulse V2 Verification-Gated Apply — Phase 6.11 final pre-execution decision gate.
 * Determines whether apply would be allowed. Does NOT execute, apply, rollback, or modify files.
 */

import { getDevPulseV2AutoFixControlPanel } from '../auto-fix-control/index.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import {
  EVIDENCE_LEDGER_OWNER_MODULE,
  getDevPulseV2ExecutionEvidenceLedger,
} from '../execution-evidence-ledger/index.js';
import {
  getDevPulseV2ExecutionRealityValidation,
  REALITY_VALIDATION_OWNER_MODULE,
} from '../execution-reality-validation/index.js';
import {
  buildGovernanceContextFromSystems,
  getDevPulseV2RecoveryChains,
  RECOVERY_CHAINS_OWNER_MODULE,
} from '../recovery-chains/index.js';
import {
  getDevPulseV2RollbackRetryEngine,
  ROLLBACK_RETRY_ENGINE_OWNER_MODULE,
} from '../rollback-retry-engine/index.js';
import { AUTO_FIX_CONTROL_OWNER_MODULE } from '../auto-fix-control/types.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { runApplyGateChecks } from './apply-gate-checker.js';
import { attachApplyEvidence } from './apply-evidence.js';
import { formatVerificationGatedApplyReport } from './apply-report.js';
import { evaluateApplyPolicy } from './apply-policy-engine.js';
import { evaluateApplyReadiness } from './apply-readiness-evaluator.js';
import { evaluateApplyRisk } from './apply-risk-engine.js';
import type {
  ApplyGateInput,
  ApplyState,
  ApplyVerdict,
  VerificationGatedApplyRecord,
  VerificationGatedApplyState,
} from './types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2VerificationGatedApply | null = null;

function createGateId(): string {
  return `verification-gated-apply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createApplyRecordId(): string {
  return `apply-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneRecord(record: VerificationGatedApplyRecord): VerificationGatedApplyRecord {
  return {
    ...record,
    evidenceLinks: record.evidenceLinks.map((l) => ({ ...l })),
    stateSequence: [...record.stateSequence],
    blockReasons: [...record.blockReasons],
    pendingReasons: [...record.pendingReasons],
  };
}

function buildApplyStateSequence(verdict: ApplyVerdict): ApplyState[] {
  const outcome: ApplyState =
    verdict === 'ALLOW'
      ? 'APPLY_ALLOWED'
      : verdict === 'PENDING'
        ? 'APPLY_PENDING_APPROVAL'
        : 'APPLY_BLOCKED';

  return [
    'APPLY_INPUT_RECEIVED',
    'READINESS_EVALUATED',
    'POLICY_CHECK_COMPLETED',
    'RISK_EVALUATED',
    'EVIDENCE_ATTACHED',
    outcome,
    'APPLY_RECORD_CREATED',
  ];
}

export function evaluateVerificationGatedApply(input: ApplyGateInput): VerificationGatedApplyRecord {
  const checks = runApplyGateChecks(input);
  const riskLevel = evaluateApplyRisk(input, checks);
  const readinessState = evaluateApplyReadiness(checks);
  const policy = evaluateApplyPolicy(checks, riskLevel);
  const evidenceLinks = attachApplyEvidence(input);

  return {
    applyRecordId: createApplyRecordId(),
    packageId: input.packageId,
    readinessState,
    applyVerdict: policy.verdict,
    riskLevel,
    approvalSatisfied: checks.approvalSatisfied,
    verificationSatisfied: checks.verificationSatisfied,
    realitySatisfied: checks.realitySatisfied,
    contradictionCount: checks.contradictionCount,
    evidenceLinks,
    stateSequence: buildApplyStateSequence(policy.verdict),
    blockReasons: policy.blockReasons,
    pendingReasons: policy.pendingReasons,
    createdAt: Date.now(),
    decisionGateOnlyConfirmed: true,
    noExecutionOccurred: true,
    noFilesModified: true,
  };
}

export function applyRecordStructuralKey(record: VerificationGatedApplyRecord): string {
  return [
    record.readinessState,
    record.applyVerdict,
    record.riskLevel,
    record.approvalSatisfied,
    record.verificationSatisfied,
    record.realitySatisfied,
    record.contradictionCount,
    record.evidenceLinks.length,
  ].join('|');
}

export class DevPulseV2VerificationGatedApply {
  private readonly gateId = createGateId();
  private readonly records: VerificationGatedApplyRecord[] = [];
  private gateWarnings: string[] = ['Verification-Gated Apply Foundation V1 — decision gate only.'];
  private gateErrors: string[] = [];

  static readonly ownerModule = VERIFICATION_GATED_APPLY_OWNER_MODULE;
  static readonly ownerDomain = 'verification_gated_apply' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('verification_gated_apply');
    return owner.ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE;
  }

  static assertDuplicateCheckPasses(): boolean {
    const apply = getDevPulseV2Owner('verification_gated_apply');
    const approvalGate = getDevPulseV2Owner('founder_approval_execution_gate');
    const executionAuthority = getDevPulseV2Owner('execution_authority');
    return (
      apply.ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE &&
      apply.ownerModule !== approvalGate.ownerModule &&
      apply.ownerModule !== executionAuthority.ownerModule
    );
  }

  static assertDoesNotExecute(): boolean {
    const gate = new DevPulseV2VerificationGatedApply();
    return (
      typeof (gate as { executeApply?: unknown }).executeApply === 'undefined' &&
      typeof (gate as { proceed?: unknown }).proceed === 'undefined'
    );
  }

  static assertNoRollbackPath(): boolean {
    const gate = new DevPulseV2VerificationGatedApply();
    return typeof (gate as { performRollback?: unknown }).performRollback === 'undefined';
  }

  static assertNoRetryPath(): boolean {
    const gate = new DevPulseV2VerificationGatedApply();
    return typeof (gate as { performRetry?: unknown }).performRetry === 'undefined';
  }

  static assertNoFileModificationPath(): boolean {
    const gate = new DevPulseV2VerificationGatedApply();
    return (
      typeof (gate as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (gate as { writeFile?: unknown }).writeFile === 'undefined'
    );
  }

  static assertDependencyChain(): boolean {
    return (
      getDevPulseV2Owner('execution_reality_validation').ownerModule === REALITY_VALIDATION_OWNER_MODULE &&
      getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE &&
      getDevPulseV2Owner('recovery_chains').ownerModule === RECOVERY_CHAINS_OWNER_MODULE &&
      getDevPulseV2Owner('auto_fix_control_panel').ownerModule === AUTO_FIX_CONTROL_OWNER_MODULE &&
      getDevPulseV2Owner('rollback_retry_engine').ownerModule === ROLLBACK_RETRY_ENGINE_OWNER_MODULE &&
      getDevPulseV2Owner('verification_gated_apply').phase === 6.11
    );
  }

  evaluateApply(input: ApplyGateInput): VerificationGatedApplyRecord {
    const record = evaluateVerificationGatedApply(input);
    this.records.push(cloneRecord(record));
    this.publishSummary(record);
    return cloneRecord(record);
  }

  evaluatePackage(packageId: string): VerificationGatedApplyRecord {
    const context = buildGovernanceContextFromSystems(packageId);
    const chains = getDevPulseV2RecoveryChains().getChains().filter((c) => c.packageId === packageId);
    let recoveryChain = chains.length > 0 ? chains[chains.length - 1] : null;
    if (!recoveryChain) {
      recoveryChain = getDevPulseV2RecoveryChains().planPackage(packageId);
    }

    const autoFixRecords = getDevPulseV2AutoFixControlPanel()
      .getAllFixPermissions()
      .filter((r) => r.packageId === packageId);
    const autoFixRecord = autoFixRecords.length > 0 ? autoFixRecords[autoFixRecords.length - 1] : null;

    const rollbackPlans = getDevPulseV2RollbackRetryEngine().getPlans().filter((p) => p.packageId === packageId);
    let rollbackRetryPlan = rollbackPlans.length > 0 ? rollbackPlans[rollbackPlans.length - 1] : null;
    if (!rollbackRetryPlan) {
      rollbackRetryPlan = getDevPulseV2RollbackRetryEngine().planPackage(packageId);
    }

    return this.evaluateApply({
      packageId,
      verificationResult: context.verificationResult ?? null,
      approvalRecord: context.approvalRecord,
      realityResult: context.realityResult,
      recoveryChain,
      autoFixRecord,
      rollbackRetryPlan,
      ledgerRecord: context.ledgerRecord,
    });
  }

  getRecords(): VerificationGatedApplyRecord[] {
    return this.records.map(cloneRecord);
  }

  getGateState(): VerificationGatedApplyState {
    return {
      gateId: this.gateId,
      evaluationCount: this.records.length,
      allowedCount: this.records.filter((r) => r.applyVerdict === 'ALLOW').length,
      blockedCount: this.records.filter((r) => r.applyVerdict === 'BLOCK').length,
      pendingCount: this.records.filter((r) => r.applyVerdict === 'PENDING').length,
      warnings: [...this.gateWarnings],
      errors: [...this.gateErrors],
    };
  }

  formatReport(): string {
    return formatVerificationGatedApplyReport(this.getGateState(), this.getRecords());
  }

  getDependencySummary(): string {
    const phaseLabel = (id: string, phase: number): string => {
      if (id === 'rollback_retry_engine') return '6.10';
      if (id === 'verification_gated_apply') return '6.11';
      return String(phase);
    };
    return [
      `execution_reality_validation@${phaseLabel('execution_reality_validation', getDevPulseV2Owner('execution_reality_validation').phase)}`,
      `execution_evidence_ledger@${phaseLabel('execution_evidence_ledger', getDevPulseV2Owner('execution_evidence_ledger').phase)}`,
      `recovery_chains@${phaseLabel('recovery_chains', getDevPulseV2Owner('recovery_chains').phase)}`,
      `auto_fix_control_panel@${phaseLabel('auto_fix_control_panel', getDevPulseV2Owner('auto_fix_control_panel').phase)}`,
      `rollback_retry_engine@${phaseLabel('rollback_retry_engine', getDevPulseV2Owner('rollback_retry_engine').phase)}`,
    ].join(' → ');
  }

  private publishSummary(record: VerificationGatedApplyRecord): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Apply gate: ${record.applyVerdict} for ${record.packageId}`,
      summary: `Record ${record.applyRecordId} — readiness ${record.readinessState}. Decision gate only.`,
      relatedEvidenceIds: record.evidenceLinks.map((l) => l.linkId),
      relatedRecordId: record.applyRecordId,
      status: record.applyVerdict === 'ALLOW' ? 'PASS' : record.applyVerdict === 'PENDING' ? 'WARN' : 'FAIL',
      warnings: ['Verification-gated apply decision only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2VerificationGatedApply(): DevPulseV2VerificationGatedApply {
  singleton = new DevPulseV2VerificationGatedApply();
  return singleton;
}

export function getDevPulseV2VerificationGatedApply(): DevPulseV2VerificationGatedApply {
  if (!singleton) {
    singleton = new DevPulseV2VerificationGatedApply();
  }
  return singleton;
}

export function resetDevPulseV2VerificationGatedApplyForTests(): DevPulseV2VerificationGatedApply {
  singleton = new DevPulseV2VerificationGatedApply();
  return singleton;
}

export function applyStateIncludes(states: ApplyState[], target: ApplyState): boolean {
  return states.includes(target);
}

void getDevPulseV2ExecutionRealityValidation;
