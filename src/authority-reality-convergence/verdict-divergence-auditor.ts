/**
 * Phase 27.00 — Verdict divergence auditor (V1).
 */

import type { ExecutionProofConsumerRecord } from '../execution-proof-source-unification/execution-proof-source-unification-types.js';
import type { AuthoritativeRealitySource, RealityAuditFinding } from './authority-reality-convergence-types.js';

export function auditVerdictDivergence(input: {
  authoritative: AuthoritativeRealitySource;
  consumerRecords: readonly ExecutionProofConsumerRecord[];
}): RealityAuditFinding[] {
  const findings: RealityAuditFinding[] = [];
  const appProven = input.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN';
  const diskClean =
    input.authoritative.diskMissingArtifacts === 0 &&
    input.authoritative.diskExistingArtifacts > 0 &&
    input.authoritative.workspaceExistsOnDisk;

  for (const record of input.consumerRecords) {
    const verdictMismatch =
      appProven && record.verdict === 'NOT_PROVEN' && !record.consumesRuntimeBridge;
    const artifactsMisreported =
      diskClean &&
      record.verdict === 'NOT_PROVEN' &&
      /missing artifacts|ARTIFACTS_MISREPORTED|artifacts→files broken/i.test(record.detail);
    const cachedVerdict =
      verdictMismatch &&
      /cached authority snapshot|stale markdown report/i.test(record.reportSource);

    const aligned = !verdictMismatch && !artifactsMisreported;

    let consumerKind: RealityAuditFinding['consumerKind'] = null;
    if (artifactsMisreported) consumerKind = 'ARTIFACTS_MISREPORTED';
    else if (cachedVerdict) consumerKind = 'CACHED_VERDICT_CONSUMER';
    else if (verdictMismatch) consumerKind = 'VERDICT_DIVERGENCE';

    findings.push({
      readOnly: true,
      auditKind: 'verdict',
      authorityId: record.authorityId,
      authorityName: record.authorityName,
      consumerValue: record.verdict,
      authoritativeValue: input.authoritative.finalApplicationTruth,
      aligned,
      consumerKind,
      detail: record.detail,
    });
  }

  return findings;
}
