/**
 * Evidence ledger record builder — assembles permanent history records from chain inputs.
 */

import { buildEvidenceLinks } from './evidence-link-builder.js';
import type { EvidenceChainInput, ExecutionEvidenceLedgerRecord, LedgerState } from './types.js';

function createLedgerRecordId(): string {
  return `ledger-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildLedgerStateSequence(chain: EvidenceChainInput): LedgerState[] {
  const states: LedgerState[] = ['LEDGER_INPUT_RECEIVED'];

  const hasReferences =
    chain.authorityId !== null ||
    chain.runtimeRecordId !== null ||
    chain.verificationId !== null;

  if (hasReferences) {
    states.push('CHAIN_REFERENCES_CAPTURED');
  }

  const links = buildEvidenceLinks(chain, Date.now());
  if (links.length > 0) {
    states.push('EVIDENCE_LINKS_CREATED');
  }

  states.push('LEDGER_RECORD_CREATED', 'LEDGER_INDEX_UPDATED', 'LEDGER_STORAGE_CONFIRMED');

  return states;
}

export function buildExecutionEvidenceLedgerRecord(
  chain: EvidenceChainInput,
): ExecutionEvidenceLedgerRecord {
  const createdAt = Date.now();
  const evidenceLinks = buildEvidenceLinks(chain, createdAt);

  return {
    ledgerRecordId: createLedgerRecordId(),
    packageId: chain.packageId,
    authorityId: chain.authorityId,
    runtimeRecordId: chain.runtimeRecordId,
    verificationId: chain.verificationId,
    recoveryPlanId: chain.recoveryPlanId,
    approvalRequestId: chain.approvalRequestId,
    realityValidationId: chain.realityValidationId,
    runtimeDecision: chain.runtimeDecision,
    verificationVerdict: chain.verificationVerdict,
    recoveryNeed: chain.recoveryNeed,
    approvalDecision: chain.approvalDecision,
    realityVerdict: chain.realityVerdict,
    confidence: chain.confidence,
    chainComplete: chain.chainComplete,
    contradictions: chain.contradictions.map((c) => ({ ...c })),
    evidenceLinks,
    stateSequence: buildLedgerStateSequence(chain),
    createdAt,
    historyOnlyConfirmed: true,
    noExecutionOccurred: true,
  };
}
