/**
 * Evidence chain indexer — lookup indexes for ledger records.
 */

import type { ExecutionEvidenceLedgerRecord } from './types.js';

export interface LedgerIndex {
  byPackageId: Map<string, string[]>;
  byVerificationId: Map<string, string[]>;
  byApprovalRequestId: Map<string, string[]>;
  byRealityValidationId: Map<string, string[]>;
}

export function createEmptyLedgerIndex(): LedgerIndex {
  return {
    byPackageId: new Map(),
    byVerificationId: new Map(),
    byApprovalRequestId: new Map(),
    byRealityValidationId: new Map(),
  };
}

function appendIndex(map: Map<string, string[]>, key: string, recordId: string): void {
  const existing = map.get(key) ?? [];
  existing.push(recordId);
  map.set(key, existing);
}

export function indexLedgerRecord(index: LedgerIndex, record: ExecutionEvidenceLedgerRecord): void {
  appendIndex(index.byPackageId, record.packageId, record.ledgerRecordId);

  if (record.verificationId) {
    appendIndex(index.byVerificationId, record.verificationId, record.ledgerRecordId);
  }
  if (record.approvalRequestId) {
    appendIndex(index.byApprovalRequestId, record.approvalRequestId, record.ledgerRecordId);
  }
  if (record.realityValidationId) {
    appendIndex(index.byRealityValidationId, record.realityValidationId, record.ledgerRecordId);
  }
}

export function lookupByPackageId(index: LedgerIndex, packageId: string): string[] {
  return [...(index.byPackageId.get(packageId) ?? [])];
}

export function lookupByVerificationId(index: LedgerIndex, verificationId: string): string[] {
  return [...(index.byVerificationId.get(verificationId) ?? [])];
}

export function lookupByApprovalRequestId(index: LedgerIndex, approvalRequestId: string): string[] {
  return [...(index.byApprovalRequestId.get(approvalRequestId) ?? [])];
}

export function lookupByRealityValidationId(
  index: LedgerIndex,
  realityValidationId: string,
): string[] {
  return [...(index.byRealityValidationId.get(realityValidationId) ?? [])];
}
