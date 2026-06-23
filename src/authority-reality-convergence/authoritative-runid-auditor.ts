/**
 * Phase 27.00 — Authoritative runId auditor (V1).
 */

import { describeRunIdSource } from '../execution-proof-source-unification/authoritative-runid-resolver.js';
import type { ExecutionProofConsumerRecord } from '../execution-proof-source-unification/execution-proof-source-unification-types.js';
import type { AuthoritativeRealitySource, RealityAuditFinding } from './authority-reality-convergence-types.js';

function isStaleRunId(runId: string | null): boolean {
  if (!runId) return false;
  return runId.startsWith('stale-') || runId.includes('historical') || runId.includes('cached-');
}

export function auditAuthoritativeRunId(input: {
  authoritative: AuthoritativeRealitySource;
  consumerRecords: readonly ExecutionProofConsumerRecord[];
}): RealityAuditFinding[] {
  const findings: RealityAuditFinding[] = [];

  for (const record of input.consumerRecords) {
    const runIdMismatch = Boolean(
      record.runId &&
        input.authoritative.authoritativeRunId &&
        record.runId !== input.authoritative.authoritativeRunId,
    );
    const staleRunId = isStaleRunId(record.runId);
    const aligned =
      !runIdMismatch &&
      !staleRunId &&
      (record.runId === input.authoritative.authoritativeRunId ||
        (!record.runId && record.consumesRuntimeBridge));

    findings.push({
      readOnly: true,
      auditKind: 'runId',
      authorityId: record.authorityId,
      authorityName: record.authorityName,
      consumerValue: record.runId,
      authoritativeValue: input.authoritative.authoritativeRunId,
      aligned,
      consumerKind: runIdMismatch ? 'RUNID_MISMATCH' : staleRunId ? 'STALE_PROOF_CONSUMER' : null,
      detail: describeRunIdSource({
        runId: record.runId,
        authoritativeRunId: input.authoritative.authoritativeRunId,
        dataSource: record.authorityId,
      }),
    });
  }

  return findings;
}
