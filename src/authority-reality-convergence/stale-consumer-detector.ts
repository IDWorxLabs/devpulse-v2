/**
 * Phase 27.00 — Stale consumer detector (V1).
 */

import { STALE_CONSUMER_REPORT_PATTERNS } from './authority-reality-convergence-registry.js';
import type {
  AuthoritativeRealitySource,
  AuthorityRealityDivergence,
  RealityAuditFinding,
  RealityConsumerKind,
} from './authority-reality-convergence-types.js';
import { TESTING_INFRASTRUCTURE_DEFECT } from '../execution-proof-source-unification/execution-proof-source-unification-registry.js';

function launchImpactForKind(
  kind: RealityConsumerKind,
  authoritative: AuthoritativeRealitySource,
): AuthorityRealityDivergence['launchImpact'] {
  if (kind === 'ARTIFACTS_MISREPORTED' || kind === 'VERDICT_DIVERGENCE') {
    if (
      authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
      authoritative.diskMissingArtifacts === 0
    ) {
      return TESTING_INFRASTRUCTURE_DEFECT;
    }
    return 'EVIDENCE_PROPAGATION_FAILURE';
  }

  if (
    kind === 'STALE_PROOF_CONSUMER' ||
    kind === 'CACHED_VERDICT_CONSUMER' ||
    kind === 'STALE_REPORT_CONSUMER' ||
    kind === 'WORKSPACE_MISMATCH' ||
    kind === 'RUNID_MISMATCH' ||
    kind === 'MANIFEST_MISMATCH' ||
    kind === 'PROOF_TIMESTAMP_DIVERGENCE'
  ) {
    return TESTING_INFRASTRUCTURE_DEFECT;
  }

  return 'REAL_PRODUCT_GAP';
}

function authoritativeLabel(authoritative: AuthoritativeRealitySource): string {
  return [
    authoritative.authoritativeWorkspaceId ?? 'no-workspace',
    authoritative.authoritativeRunId ?? 'no-runId',
    authoritative.authoritativeManifestId ?? 'no-manifest',
    authoritative.authoritativeProofTimestamp ?? 'no-timestamp',
  ].join('|');
}

export function detectStaleConsumers(input: {
  authoritative: AuthoritativeRealitySource;
  auditFindings: readonly RealityAuditFinding[];
}): AuthorityRealityDivergence[] {
  const divergences: AuthorityRealityDivergence[] = [];
  const seen = new Set<string>();

  for (const finding of input.auditFindings) {
    if (finding.aligned || !finding.consumerKind) continue;

    const key = `${finding.authorityId}:${finding.consumerKind}:${finding.auditKind}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const consumingSource = [
      finding.authorityName,
      finding.consumerValue ?? 'n/a',
      finding.detail,
    ].join(' — ');

    divergences.push({
      readOnly: true,
      authoritativeSource: authoritativeLabel(input.authoritative),
      consumingSource,
      divergenceReason: finding.consumerKind,
      detail: `${finding.auditKind} audit: expected ${finding.authoritativeValue ?? 'n/a'}, got ${finding.consumerValue ?? 'n/a'} — ${finding.detail}`,
      launchImpact: launchImpactForKind(finding.consumerKind, input.authoritative),
    });
  }

  return divergences;
}

export function detectCachedVerdictConsumers(input: {
  auditFindings: readonly RealityAuditFinding[];
}): number {
  return input.auditFindings.filter((f) => f.consumerKind === 'CACHED_VERDICT_CONSUMER').length;
}

export function detectStaleReportConsumers(input: {
  auditFindings: readonly RealityAuditFinding[];
}): number {
  return input.auditFindings.filter((f) => f.consumerKind === 'STALE_REPORT_CONSUMER').length;
}

export function detectStaleProofConsumers(input: {
  auditFindings: readonly RealityAuditFinding[];
}): number {
  return input.auditFindings.filter((f) => f.consumerKind === 'STALE_PROOF_CONSUMER').length;
}

export function isStaleConsumerReportSource(reportSource: string): boolean {
  return STALE_CONSUMER_REPORT_PATTERNS.some((p) => p.test(reportSource));
}
