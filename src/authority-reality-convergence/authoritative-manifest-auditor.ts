/**
 * Phase 27.00 — Authoritative manifest auditor (V1).
 */

import type { ExecutionProofConsumerRecord } from '../execution-proof-source-unification/execution-proof-source-unification-types.js';
import type { AuthoritativeRealitySource, RealityAuditFinding } from './authority-reality-convergence-types.js';

export function auditAuthoritativeManifest(input: {
  authoritative: AuthoritativeRealitySource;
  consumerRecords: readonly ExecutionProofConsumerRecord[];
}): RealityAuditFinding[] {
  const findings: RealityAuditFinding[] = [];

  for (const record of input.consumerRecords) {
    const manifestMismatch = Boolean(
      record.manifestId &&
        input.authoritative.authoritativeManifestId &&
        record.manifestId !== input.authoritative.authoritativeManifestId,
    );
    const aligned =
      !manifestMismatch &&
      (record.manifestId === input.authoritative.authoritativeManifestId ||
        (!record.manifestId && record.consumesRuntimeBridge));

    findings.push({
      readOnly: true,
      auditKind: 'manifest',
      authorityId: record.authorityId,
      authorityName: record.authorityName,
      consumerValue: record.manifestId,
      authoritativeValue: input.authoritative.authoritativeManifestId,
      aligned,
      consumerKind: manifestMismatch ? 'MANIFEST_MISMATCH' : null,
      detail: record.manifestId
        ? `manifest (${record.manifestId})`
        : 'SOURCE_NOT_DISCOVERABLE',
    });
  }

  return findings;
}
