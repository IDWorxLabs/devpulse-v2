/**
 * DevPulse V2 Founder Approval Execution Gate — constitutional approval authority.
 * Does NOT execute, modify files, perform recovery, or auto-approve.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import type { RecoveryRecord } from '../recovery-execution/types.js';
import { classifyApprovalRequirement, approvalRequired } from './founder-approval-classifier.js';
import { runConstitutionCheck } from './founder-approval-constitution-check.js';
import { formatFounderApprovalReport } from './founder-approval-report.js';
import {
  assertExecutionStackDependencies,
  getRecoveryRecordByPackageId,
} from './founder-approval-recovery-bridge.js';
import { evaluateFounderRisk } from './founder-risk-evaluator.js';
import {
  approvalStateIncludes,
  buildApprovalStateSequence,
  createApprovalRequestId,
} from './founder-approval-state-machine.js';
import type {
  ApprovalDecisionType,
  FounderApprovalGateState,
  FounderApprovalRecord,
  FounderApprovalRequest,
} from './types.js';
import { APPROVAL_GATE_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2FounderApprovalExecutionGate | null = null;

function createGateId(): string {
  return `founder-approval-gate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneRecord(record: FounderApprovalRecord): FounderApprovalRecord {
  return {
    ...record,
    constitutionalRulesTriggered: [...record.constitutionalRulesTriggered],
    affectedDomains: [...record.affectedDomains],
    stateSequence: [...record.stateSequence],
    warnings: [...record.warnings],
    errors: [...record.errors],
  };
}

function extractAffectedDomains(record: RecoveryRecord): string[] {
  const domains = new Set<string>();
  const pkg = record.verificationResult.runtimeRecord?.package;
  if (pkg?.targetDomain) {
    domains.add(pkg.targetDomain);
  }
  if (record.plan.requiredGate) {
    domains.add(record.plan.requiredGate);
  }
  domains.add('execution_authority');
  return [...domains];
}

function resolveFutureGate(record: RecoveryRecord): string | undefined {
  if (record.plan.requiredGate) {
    return record.plan.requiredGate;
  }
  return record.plan.strategy === 'NONE' ? undefined : 'founder_approval_execution_gate';
}

export function buildFounderApprovalRecord(
  recoveryRecord: RecoveryRecord,
  decisionOverride?: ApprovalDecisionType,
): FounderApprovalRecord {
  const requirement = classifyApprovalRequirement(recoveryRecord);
  const riskLevel = evaluateFounderRisk(recoveryRecord, requirement);
  const constitutionalRulesTriggered = runConstitutionCheck(recoveryRecord);

  let decision: ApprovalDecisionType;
  if (decisionOverride) {
    decision = decisionOverride;
  } else if (!approvalRequired(requirement)) {
    decision = 'APPROVED';
  } else {
    decision = 'PENDING';
  }

  const stateSequence = buildApprovalStateSequence(requirement, decision);

  return {
    approvalRequestId: createApprovalRequestId(),
    verificationId: recoveryRecord.plan.verificationId,
    recoveryPlanId: recoveryRecord.plan.recoveryPlanId,
    packageId: recoveryRecord.plan.packageId,
    createdAt: Date.now(),
    approvalRequirement: requirement,
    riskLevel,
    decision,
    constitutionalRulesTriggered,
    affectedDomains: extractAffectedDomains(recoveryRecord),
    futureGateUnlockedIfApproved: approvalRequired(requirement)
      ? resolveFutureGate(recoveryRecord)
      : undefined,
    stateSequence,
    noExecutionOccurred: true,
    warnings: [
      'Founder Approval Execution Gate — governance only, no execution performed.',
      'No auto-approval — founder must explicitly grant or deny when required.',
    ],
    errors: [],
  };
}

export class DevPulseV2FounderApprovalExecutionGate {
  private readonly gateId = createGateId();
  private readonly records = new Map<string, FounderApprovalRecord>();
  private gateWarnings: string[] = [
    'Founder Approval Execution Gate Foundation V1 — approval governance only.',
  ];
  private gateErrors: string[] = [];

  static readonly ownerModule = APPROVAL_GATE_OWNER_MODULE;
  static readonly ownerDomain = 'founder_approval_execution_gate' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('founder_approval_execution_gate');
    return owner.ownerModule === APPROVAL_GATE_OWNER_MODULE;
  }

  static assertDoesNotExecute(): boolean {
    const gate = new DevPulseV2FounderApprovalExecutionGate();
    return (
      typeof (gate as { execute?: unknown }).execute === 'undefined' &&
      typeof (gate as { runRecovery?: unknown }).runRecovery === 'undefined' &&
      typeof (gate as { autoApprove?: unknown }).autoApprove === 'undefined'
    );
  }

  static assertDoesNotAutoApprove(): boolean {
    const gate = new DevPulseV2FounderApprovalExecutionGate();
    return typeof (gate as { autoApprove?: unknown }).autoApprove === 'undefined';
  }

  static assertDependencyChain(): boolean {
    return (
      assertExecutionStackDependencies() &&
      getDevPulseV2Owner('execution_authority').phase === 6.1 &&
      getDevPulseV2Owner('execution_package_runtime').phase === 6.2 &&
      getDevPulseV2Owner('execution_verification_loop').phase === 6.3 &&
      getDevPulseV2Owner('recovery_execution_engine').phase === 6.4 &&
      getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5
    );
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const approval = getDevPulseV2Owner('founder_approval_execution_gate');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      approval.ownerModule === APPROVAL_GATE_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  evaluateApprovalRequest(recoveryRecord: RecoveryRecord): FounderApprovalRecord {
    const record = buildFounderApprovalRecord(recoveryRecord);
    this.records.set(record.approvalRequestId, cloneRecord(record));
    this.publishSummary(record);
    return cloneRecord(record);
  }

  evaluateApprovalForPackage(packageId: string): FounderApprovalRecord | null {
    const recovery = getRecoveryRecordByPackageId(packageId);
    if (!recovery) {
      return null;
    }
    return this.evaluateApprovalRequest(recovery);
  }

  grantFounderApproval(approvalRequestId: string): FounderApprovalRecord | null {
    const existing = this.records.get(approvalRequestId);
    if (!existing || !approvalRequired(existing.approvalRequirement)) {
      return existing ? cloneRecord(existing) : null;
    }

    const updated: FounderApprovalRecord = {
      ...existing,
      decision: 'APPROVED',
      stateSequence: buildApprovalStateSequence(existing.approvalRequirement, 'APPROVED'),
      warnings: [...existing.warnings, 'Founder explicitly granted approval — still no execution in this gate.'],
    };
    this.records.set(approvalRequestId, updated);
    this.publishSummary(updated);
    return cloneRecord(updated);
  }

  denyFounderApproval(approvalRequestId: string): FounderApprovalRecord | null {
    const existing = this.records.get(approvalRequestId);
    if (!existing || !approvalRequired(existing.approvalRequirement)) {
      return existing ? cloneRecord(existing) : null;
    }

    const updated: FounderApprovalRecord = {
      ...existing,
      decision: 'DENIED',
      stateSequence: buildApprovalStateSequence(existing.approvalRequirement, 'DENIED'),
      warnings: [...existing.warnings, 'Founder explicitly denied approval.'],
    };
    this.records.set(approvalRequestId, updated);
    this.publishSummary(updated);
    return cloneRecord(updated);
  }

  getRecord(approvalRequestId: string): FounderApprovalRecord | null {
    const found = this.records.get(approvalRequestId);
    return found ? cloneRecord(found) : null;
  }

  listRecords(): FounderApprovalRecord[] {
    return [...this.records.values()].map(cloneRecord);
  }

  getGateState(): FounderApprovalGateState {
    const all = this.listRecords();
    return {
      gateId: this.gateId,
      requestCount: all.length,
      pendingCount: all.filter((r) => r.decision === 'PENDING').length,
      approvedCount: all.filter((r) => r.decision === 'APPROVED').length,
      deniedCount: all.filter((r) => r.decision === 'DENIED').length,
      warnings: [...this.gateWarnings],
      errors: [...this.gateErrors],
    };
  }

  formatReport(): string {
    return formatFounderApprovalReport(this.getGateState(), this.listRecords());
  }

  private publishSummary(record: FounderApprovalRecord): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Founder approval: ${record.decision}`,
      summary: `Package ${record.packageId} — ${record.approvalRequirement}. Approval governance only, no execution.`,
      relatedEvidenceIds: [],
      relatedRecordId: record.approvalRequestId,
      status: record.decision === 'DENIED' ? 'FAIL' : record.decision === 'PENDING' ? 'WARN' : 'INFO',
      warnings: [...record.warnings],
      errors: [...record.errors],
    });
  }
}

export function createDevPulseV2FounderApprovalExecutionGate(): DevPulseV2FounderApprovalExecutionGate {
  singleton = new DevPulseV2FounderApprovalExecutionGate();
  return singleton;
}

export function getDevPulseV2FounderApprovalExecutionGate(): DevPulseV2FounderApprovalExecutionGate {
  if (!singleton) {
    singleton = new DevPulseV2FounderApprovalExecutionGate();
  }
  return singleton;
}

export function resetDevPulseV2FounderApprovalExecutionGateForTests(): DevPulseV2FounderApprovalExecutionGate {
  singleton = new DevPulseV2FounderApprovalExecutionGate();
  return singleton;
}

export { approvalStateIncludes };
