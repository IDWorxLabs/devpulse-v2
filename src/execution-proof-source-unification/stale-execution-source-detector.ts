/**
 * Phase 26.94 — Stale execution source detector (V1).
 */

import {
  STALE_NOT_PROVEN_BLOCKER_PATTERNS,
  TESTING_INFRASTRUCTURE_DEFECT,
} from './execution-proof-source-unification-registry.js';
import type {
  AuthoritativeExecutionSource,
  ExecutionProofConsumerRecord,
  ExecutionProofSourceClassification,
  StaleExecutionSourceFinding,
} from './execution-proof-source-unification-types.js';

export function detectStaleExecutionSources(input: {
  records: readonly ExecutionProofConsumerRecord[];
  authoritative: AuthoritativeExecutionSource;
}): StaleExecutionSourceFinding[] {
  const findings: StaleExecutionSourceFinding[] = [];
  const appProven = input.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN';

  for (const record of input.records) {
    if (record.classification === 'AUTHORITATIVE_SOURCE') continue;

    findings.push({
      readOnly: true,
      authorityId: record.authorityId,
      authorityName: record.authorityName,
      classification: record.classification,
      staleValue: record.workspaceId ?? record.runId ?? record.manifestId ?? record.reportTimestamp ?? 'unknown',
      authoritativeValue:
        pickAuthoritativeValue(record.classification, input.authoritative) ?? null,
      launchImpact:
        appProven && record.staleEvidence && record.verdict === 'NOT_PROVEN'
          ? TESTING_INFRASTRUCTURE_DEFECT
          : 'REAL_PRODUCT_GAP',
      detail: `${record.authorityName}: ${record.classification} — ${record.detail}`,
    });
  }

  return dedupeFindings(findings);
}

function pickAuthoritativeValue(
  classification: ExecutionProofSourceClassification,
  authoritative: AuthoritativeExecutionSource,
): string | null {
  switch (classification) {
    case 'STALE_WORKSPACE':
      return authoritative.authoritativeWorkspaceId;
    case 'STALE_RUNID':
      return authoritative.authoritativeRunId;
    case 'STALE_MANIFEST':
      return authoritative.authoritativeManifestId;
    case 'STALE_REPORT':
      return authoritative.authoritativeReportTimestamp;
    default:
      return authoritative.authoritativeWorkspaceId;
  }
}

function dedupeFindings(findings: StaleExecutionSourceFinding[]): StaleExecutionSourceFinding[] {
  const seen = new Set<string>();
  const out: StaleExecutionSourceFinding[] = [];
  for (const finding of findings) {
    const key = `${finding.authorityId}:${finding.classification}:${finding.staleValue}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finding);
  }
  return out;
}

export function classifyLaunchBlockerFromStaleExecutionSource(input: {
  blockerExplanation: string;
  authoritative: AuthoritativeExecutionSource;
  hasStaleFinding: boolean;
}): { genuineProductGap: boolean; reclassified: boolean; defectClass: string | null } {
  const matchesStalePattern = STALE_NOT_PROVEN_BLOCKER_PATTERNS.some((p) =>
    p.test(input.blockerExplanation),
  );

  if (
    input.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
    matchesStalePattern
  ) {
    return {
      genuineProductGap: false,
      reclassified: true,
      defectClass: TESTING_INFRASTRUCTURE_DEFECT,
    };
  }

  return { genuineProductGap: true, reclassified: false, defectClass: null };
}
