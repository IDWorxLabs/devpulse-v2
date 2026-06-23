/**
 * Phase 26.91 — Authority report source auditor (V1).
 */

import type {
  AuthorityEvidenceRecord,
  AuthoritativeEvidenceSource,
} from './authority-evidence-source-realignment-types.js';

export function auditAuthorityReportSources(input: {
  records: AuthorityEvidenceRecord[];
  authoritative: AuthoritativeEvidenceSource;
  nowMs?: number;
}): AuthorityEvidenceRecord[] {
  const nowMs = input.nowMs ?? Date.now();
  const authoritativeTs = parseTimestamp(input.authoritative.authoritativeReportTimestamp);

  return input.records.map((record) => {
    const recordTs = parseTimestamp(record.reportTimestamp);
    const reportStale = Boolean(
      authoritativeTs != null &&
        recordTs != null &&
        recordTs < authoritativeTs,
    );

    const evidenceTs = parseTimestamp(record.evidenceTimestamp);
    const evidenceOlderThanReport = Boolean(
      authoritativeTs != null &&
        evidenceTs != null &&
        evidenceTs < authoritativeTs,
    );

    let failureClass = record.failureClass;
    if ((reportStale || evidenceOlderThanReport) && failureClass === 'NONE') {
      failureClass = 'STALE_REPORT';
    }

    return {
      ...record,
      reportStale: reportStale || evidenceOlderThanReport,
      evidenceStale: record.evidenceStale || reportStale || evidenceOlderThanReport,
      failureClass,
      blocksLaunchFromStaleEvidence:
        record.blocksLaunchFromStaleEvidence ||
        ((reportStale || evidenceOlderThanReport) && record.verdict === 'NOT_PROVEN'),
    };
  });
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

export function resolveNewestReportTimestamp(timestamps: readonly (string | null | undefined)[]): string | null {
  let newest: string | null = null;
  let newestMs = -1;
  for (const ts of timestamps) {
    const ms = ts ? Date.parse(ts) : NaN;
    if (!Number.isNaN(ms) && ms > newestMs) {
      newestMs = ms;
      newest = ts ?? null;
    }
  }
  return newest;
}
