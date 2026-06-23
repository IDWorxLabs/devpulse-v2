/**
 * Phase 26.91 — Authority runId source auditor (V1).
 */

import type {
  AuthorityEvidenceRecord,
  AuthoritativeEvidenceSource,
} from './authority-evidence-source-realignment-types.js';

export function auditAuthorityRunIdSources(input: {
  records: AuthorityEvidenceRecord[];
  authoritative: AuthoritativeEvidenceSource;
}): AuthorityEvidenceRecord[] {
  const { authoritative } = input;

  return input.records.map((record) => {
    const runIdStale = Boolean(
      record.runId &&
        authoritative.authoritativeRunId &&
        record.runId !== authoritative.authoritativeRunId &&
        record.authorityId !== 'FOUNDER_TEST_INTEGRATION',
    );

    let failureClass = record.failureClass;
    if (runIdStale && failureClass === 'NONE') {
      failureClass = 'STALE_RUNID';
    }

    return {
      ...record,
      runIdStale,
      evidenceStale: record.evidenceStale || runIdStale,
      failureClass,
      blocksLaunchFromStaleEvidence:
        record.blocksLaunchFromStaleEvidence ||
        (runIdStale && record.verdict === 'NOT_PROVEN'),
    };
  });
}

export function resolveAuthoritativeRunId(input: {
  explicitRunId?: string | null;
  founderFlowRunId?: string | null;
  founderTestRunId?: string | null;
}): string | null {
  return input.explicitRunId ?? input.founderFlowRunId ?? input.founderTestRunId ?? null;
}
