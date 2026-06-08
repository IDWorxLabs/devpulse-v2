/**
 * DevPulse V2 Execution Evidence Ledger — Phase 6 permanent evidence history layer.
 * Records only. Does NOT execute, validate, decide, or modify files.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { buildExecutionEvidenceLedgerRecord } from './evidence-ledger-record-builder.js';
import { countLinksByType } from './evidence-link-builder.js';
import {
  assertPhase67DependenciesPresent,
  buildEvidenceChainFromSystems,
} from './evidence-reality-bridge.js';
import { EvidenceHistoryStore } from './evidence-history-store.js';
import {
  buildExecutionEvidenceReport,
  formatExecutionEvidenceReport,
} from './execution-evidence-report.js';
import type {
  EvidenceChainInput,
  ExecutionEvidenceLedgerRecord,
  ExecutionEvidenceLedgerState,
  LedgerState,
} from './types.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2ExecutionEvidenceLedger | null = null;

function createLedgerId(): string {
  return `exec-evidence-ledger-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneRecord(record: ExecutionEvidenceLedgerRecord): ExecutionEvidenceLedgerRecord {
  return {
    ...record,
    contradictions: record.contradictions.map((c) => ({ ...c })),
    evidenceLinks: record.evidenceLinks.map((l) => ({ ...l })),
    stateSequence: [...record.stateSequence],
  };
}

export class DevPulseV2ExecutionEvidenceLedger {
  private readonly ledgerId = createLedgerId();
  private readonly store = new EvidenceHistoryStore();
  private ledgerWarnings: string[] = [
    'Execution Evidence Ledger Foundation V1 — history recording only.',
  ];
  private ledgerErrors: string[] = [];

  static readonly ownerModule = EVIDENCE_LEDGER_OWNER_MODULE;
  static readonly ownerDomain = 'execution_evidence_ledger' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('execution_evidence_ledger');
    return owner.ownerModule === EVIDENCE_LEDGER_OWNER_MODULE;
  }

  static assertDoesNotExecute(): boolean {
    const ledger = new DevPulseV2ExecutionEvidenceLedger();
    return (
      typeof (ledger as { execute?: unknown }).execute === 'undefined' &&
      typeof (ledger as { runRecovery?: unknown }).runRecovery === 'undefined' &&
      typeof (ledger as { validatePackage?: unknown }).validatePackage === 'undefined'
    );
  }

  static assertDoesNotValidate(): boolean {
    const ledger = new DevPulseV2ExecutionEvidenceLedger();
    return (
      typeof (ledger as { validateChain?: unknown }).validateChain === 'undefined' &&
      typeof (ledger as { detectContradictions?: unknown }).detectContradictions === 'undefined'
    );
  }

  static assertDependencyChain(): boolean {
    return (
      assertPhase67DependenciesPresent() &&
      getDevPulseV2Owner('execution_authority').phase === 6.1 &&
      getDevPulseV2Owner('execution_package_runtime').phase === 6.2 &&
      getDevPulseV2Owner('execution_verification_loop').phase === 6.3 &&
      getDevPulseV2Owner('recovery_execution_engine').phase === 6.4 &&
      getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5 &&
      getDevPulseV2Owner('execution_reality_validation').phase === 6.6 &&
      getDevPulseV2Owner('execution_evidence_ledger').phase === 6.7
    );
  }

  recordPackage(packageId: string): ExecutionEvidenceLedgerRecord {
    const chain = buildEvidenceChainFromSystems(packageId);
    return this.recordChain(chain);
  }

  recordChain(chain: EvidenceChainInput): ExecutionEvidenceLedgerRecord {
    const record = buildExecutionEvidenceLedgerRecord(chain);
    const stored = this.store.recordLedgerEntry(record);
    this.publishSummary(stored);
    return cloneRecord(stored);
  }

  getLedgerEntry(ledgerRecordId: string): ExecutionEvidenceLedgerRecord | null {
    return this.store.getLedgerEntry(ledgerRecordId);
  }

  getLedgerHistory(): ExecutionEvidenceLedgerRecord[] {
    return this.store.getLedgerHistory();
  }

  getLedgerCount(): number {
    return this.store.getLedgerCount();
  }

  findByPackageId(packageId: string): ExecutionEvidenceLedgerRecord[] {
    return this.store.findByPackageId(packageId);
  }

  findByVerificationId(verificationId: string): ExecutionEvidenceLedgerRecord[] {
    return this.store.findByVerificationId(verificationId);
  }

  findByApprovalRequestId(approvalRequestId: string): ExecutionEvidenceLedgerRecord[] {
    return this.store.findByApprovalRequestId(approvalRequestId);
  }

  findByRealityValidationId(realityValidationId: string): ExecutionEvidenceLedgerRecord[] {
    return this.store.findByRealityValidationId(realityValidationId);
  }

  getLedgerState(): ExecutionEvidenceLedgerState {
    return {
      ledgerId: this.ledgerId,
      recordCount: this.store.getLedgerCount(),
      warnings: [...this.ledgerWarnings],
      errors: [...this.ledgerErrors],
    };
  }

  formatReport(): string {
    return formatExecutionEvidenceReport(this.getLedgerState(), this.getLedgerHistory());
  }

  buildReport() {
    return buildExecutionEvidenceReport(this.getLedgerState(), this.getLedgerHistory());
  }

  private publishSummary(record: ExecutionEvidenceLedgerRecord): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Execution evidence recorded: ${record.packageId}`,
      summary: `Ledger record ${record.ledgerRecordId} — ${record.evidenceLinks.length} links. History only, no execution.`,
      relatedEvidenceIds: record.evidenceLinks.map((l) => l.linkId),
      relatedRecordId: record.ledgerRecordId,
      status: 'INFO',
      warnings: ['Evidence ledger records history only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2ExecutionEvidenceLedger(): DevPulseV2ExecutionEvidenceLedger {
  singleton = new DevPulseV2ExecutionEvidenceLedger();
  return singleton;
}

export function getDevPulseV2ExecutionEvidenceLedger(): DevPulseV2ExecutionEvidenceLedger {
  if (!singleton) {
    singleton = new DevPulseV2ExecutionEvidenceLedger();
  }
  return singleton;
}

export function resetDevPulseV2ExecutionEvidenceLedgerForTests(): DevPulseV2ExecutionEvidenceLedger {
  singleton = new DevPulseV2ExecutionEvidenceLedger();
  return singleton;
}

export function ledgerStateIncludes(states: LedgerState[], target: LedgerState): boolean {
  return states.includes(target);
}

export { countLinksByType };
