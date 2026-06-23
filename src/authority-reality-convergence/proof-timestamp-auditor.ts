/**
 * Phase 27.00 — Proof timestamp auditor (V1).
 */

import type { ExecutionProofConsumerRecord } from '../execution-proof-source-unification/execution-proof-source-unification-types.js';
import type { AuthoritativeRealitySource, RealityAuditFinding } from './authority-reality-convergence-types.js';

function isStaleReportSource(reportSource: string): boolean {
  return /cached|stale markdown|historical/i.test(reportSource);
}

export function auditProofTimestamps(input: {
  authoritative: AuthoritativeRealitySource;
  consumerRecords: readonly ExecutionProofConsumerRecord[];
}): RealityAuditFinding[] {
  const findings: RealityAuditFinding[] = [];
  const authoritativeTs = input.authoritative.authoritativeProofTimestamp;

  for (const record of input.consumerRecords) {
    const timestampDivergence = Boolean(
      record.reportTimestamp &&
        authoritativeTs &&
        record.reportTimestamp < authoritativeTs,
    );
    const staleReport = isStaleReportSource(record.reportSource);
    const aligned =
      !timestampDivergence &&
      !staleReport &&
      (record.consumesRuntimeBridge ||
        record.reportTimestamp === authoritativeTs ||
        !record.reportTimestamp);

    let consumerKind: RealityAuditFinding['consumerKind'] = null;
    if (timestampDivergence) consumerKind = 'PROOF_TIMESTAMP_DIVERGENCE';
    else if (staleReport) consumerKind = 'STALE_REPORT_CONSUMER';

    findings.push({
      readOnly: true,
      auditKind: 'proofTimestamp',
      authorityId: record.authorityId,
      authorityName: record.authorityName,
      consumerValue: record.reportTimestamp,
      authoritativeValue: authoritativeTs,
      aligned,
      consumerKind,
      detail: `${record.reportSource} @ ${record.reportTimestamp ?? 'n/a'}`,
    });
  }

  return findings;
}
