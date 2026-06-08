/**
 * Execution Evidence Ledger founder-readable report.
 */

import type {
  ExecutionEvidenceLedgerState,
  ExecutionEvidenceLedgerRecord,
  ExecutionEvidenceReport,
} from './types.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from './types.js';

export function buildExecutionEvidenceReport(
  state: ExecutionEvidenceLedgerState,
  records: ExecutionEvidenceLedgerRecord[],
): ExecutionEvidenceReport {
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  return {
    ownerModule: EVIDENCE_LEDGER_OWNER_MODULE,
    recordCount: state.recordCount,
    latestRecord,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Execution Evidence Ledger records Phase 6 governance history only — no execution, validation, or decisions.',
  };
}

export function formatExecutionEvidenceReport(
  state: ExecutionEvidenceLedgerState,
  records: ExecutionEvidenceLedgerRecord[],
): string {
  const report = buildExecutionEvidenceReport(state, records);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Execution Evidence Ledger Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Ledger ID: ${state.ledgerId}`,
    `Record count: ${report.recordCount}`,
    '',
  ];

  if (report.latestRecord) {
    const r = report.latestRecord;
    lines.push(`Ledger record ID: ${r.ledgerRecordId}`);
    lines.push(`Package ID: ${r.packageId}`);
    lines.push(`Chain completeness: ${r.chainComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
    lines.push(`Confidence: ${r.confidence ?? 'unknown'}`);
    lines.push(`Reality verdict: ${r.realityVerdict ?? 'unknown'}`);
    lines.push(`Approval decision: ${r.approvalDecision ?? 'unknown'}`);
    lines.push(`Verification verdict: ${r.verificationVerdict ?? 'unknown'}`);
    lines.push(`Contradiction count: ${r.contradictions.length}`);
    lines.push(`Evidence link count: ${r.evidenceLinks.length}`);
    lines.push(`History-only behavior: ${r.historyOnlyConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push(`No execution occurred: ${r.noExecutionOccurred ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}

export function formatLedgerRecordSummary(record: ExecutionEvidenceLedgerRecord): string {
  return [
    `Ledger record: ${record.ledgerRecordId}`,
    `Package: ${record.packageId}`,
    `Links: ${record.evidenceLinks.length}`,
    `Contradictions: ${record.contradictions.length}`,
  ].join(' | ');
}
