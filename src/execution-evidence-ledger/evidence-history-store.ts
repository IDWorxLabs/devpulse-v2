/**
 * Evidence history store — in-memory permanent history foundation.
 * Records only. Does not decide, execute, or validate.
 */

import {
  createEmptyLedgerIndex,
  indexLedgerRecord,
  lookupByApprovalRequestId,
  lookupByPackageId,
  lookupByRealityValidationId,
  lookupByVerificationId,
  type LedgerIndex,
} from './evidence-chain-indexer.js';
import type { ExecutionEvidenceLedgerRecord } from './types.js';

function cloneRecord(record: ExecutionEvidenceLedgerRecord): ExecutionEvidenceLedgerRecord {
  return {
    ...record,
    contradictions: record.contradictions.map((c) => ({ ...c })),
    evidenceLinks: record.evidenceLinks.map((l) => ({ ...l })),
    stateSequence: [...record.stateSequence],
  };
}

export class EvidenceHistoryStore {
  private readonly records = new Map<string, ExecutionEvidenceLedgerRecord>();
  private readonly index: LedgerIndex = createEmptyLedgerIndex();
  private insertionOrder: string[] = [];

  recordLedgerEntry(record: ExecutionEvidenceLedgerRecord): ExecutionEvidenceLedgerRecord {
    const stored = cloneRecord(record);
    this.records.set(stored.ledgerRecordId, stored);
    this.insertionOrder.push(stored.ledgerRecordId);
    indexLedgerRecord(this.index, stored);
    return cloneRecord(stored);
  }

  getLedgerEntry(ledgerRecordId: string): ExecutionEvidenceLedgerRecord | null {
    const record = this.records.get(ledgerRecordId);
    return record ? cloneRecord(record) : null;
  }

  getLedgerHistory(): ExecutionEvidenceLedgerRecord[] {
    return this.insertionOrder
      .map((id) => this.records.get(id))
      .filter((r): r is ExecutionEvidenceLedgerRecord => r !== undefined)
      .map(cloneRecord);
  }

  getLedgerCount(): number {
    return this.records.size;
  }

  findByPackageId(packageId: string): ExecutionEvidenceLedgerRecord[] {
    return lookupByPackageId(this.index, packageId)
      .map((id) => this.records.get(id))
      .filter((r): r is ExecutionEvidenceLedgerRecord => r !== undefined)
      .map(cloneRecord);
  }

  findByVerificationId(verificationId: string): ExecutionEvidenceLedgerRecord[] {
    return lookupByVerificationId(this.index, verificationId)
      .map((id) => this.records.get(id))
      .filter((r): r is ExecutionEvidenceLedgerRecord => r !== undefined)
      .map(cloneRecord);
  }

  findByApprovalRequestId(approvalRequestId: string): ExecutionEvidenceLedgerRecord[] {
    return lookupByApprovalRequestId(this.index, approvalRequestId)
      .map((id) => this.records.get(id))
      .filter((r): r is ExecutionEvidenceLedgerRecord => r !== undefined)
      .map(cloneRecord);
  }

  findByRealityValidationId(realityValidationId: string): ExecutionEvidenceLedgerRecord[] {
    return lookupByRealityValidationId(this.index, realityValidationId)
      .map((id) => this.records.get(id))
      .filter((r): r is ExecutionEvidenceLedgerRecord => r !== undefined)
      .map(cloneRecord);
  }

  clear(): void {
    this.records.clear();
    this.insertionOrder = [];
    Object.assign(this.index, createEmptyLedgerIndex());
  }
}
