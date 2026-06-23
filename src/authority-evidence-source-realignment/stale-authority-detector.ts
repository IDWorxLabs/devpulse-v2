/**
 * Phase 26.91 — Stale authority detector (V1).
 */

import type {
  AuthorityEvidenceRecord,
  AuthoritySourceFailureClass,
  AuthoritativeEvidenceSource,
  StaleAuthorityFinding,
} from './authority-evidence-source-realignment-types.js';
import { TESTING_INFRASTRUCTURE_DEFECT } from './authority-evidence-source-realignment-registry.js';

const NOT_PROVEN_BLOCKER_PATTERNS = [
  /runtime not proven/i,
  /preview not proven/i,
  /build not proven/i,
  /live preview not proven/i,
  /cannot run applications/i,
  /cannot build applications/i,
  /not_proven/i,
];

export function detectStaleAuthorities(input: {
  records: readonly AuthorityEvidenceRecord[];
  authoritative: AuthoritativeEvidenceSource;
}): StaleAuthorityFinding[] {
  const findings: StaleAuthorityFinding[] = [];
  const appProven = input.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN';

  for (const record of input.records) {
    if (record.workspaceStale) {
      findings.push(buildFinding(record, 'STALE_WORKSPACE', record.workspaceId, input.authoritative.authoritativeWorkspaceId, appProven));
    }
    if (record.runIdStale) {
      findings.push(buildFinding(record, 'STALE_RUNID', record.runId, input.authoritative.authoritativeRunId, appProven));
    }
    if (record.manifestStale) {
      findings.push(buildFinding(record, 'STALE_MANIFEST', record.manifestId, input.authoritative.authoritativeManifestId, appProven));
    }
    if (record.reportStale) {
      findings.push(buildFinding(record, 'STALE_REPORT', record.reportTimestamp, input.authoritative.authoritativeReportTimestamp, appProven));
    }

    if (
      appProven &&
      record.contradictsAuthoritativeRuntime &&
      !record.consumesRuntimeBridge
    ) {
      findings.push({
        readOnly: true,
        authorityId: record.authorityId,
        authorityName: record.authorityName,
        failureClass: 'AUTHORITATIVE_TRUTH_IGNORED',
        staleValue: record.verdict,
        authoritativeValue: 'PROVEN',
        reclassifiedAsTestingDefect: true,
        detail: `${record.authorityName} ignores authoritative APPLICATION_PROVEN runtime truth`,
      });
    }

    if (
      appProven &&
      record.verdict === 'NOT_PROVEN' &&
      (record.runtimeProofLevel === 'NOT_PROVEN' ||
        record.previewProofLevel === 'NOT_PROVEN' ||
        record.buildProofLevel === 'NOT_PROVEN') &&
      (record.workspaceStale || record.runIdStale || record.reportStale || !record.consumesRuntimeBridge)
    ) {
      findings.push({
        readOnly: true,
        authorityId: record.authorityId,
        authorityName: record.authorityName,
        failureClass: 'EVIDENCE_PROPAGATION_FAILURE',
        staleValue: record.verdict,
        authoritativeValue: 'PROVEN',
        reclassifiedAsTestingDefect: true,
        detail: `${record.authorityName} reports NOT_PROVEN despite APPLICATION_PROVEN — stale evidence consumption`,
      });
    }
  }

  return dedupeFindings(findings);
}

export function classifyLaunchBlockerFromStaleEvidence(input: {
  blockerExplanation: string;
  authoritative: AuthoritativeEvidenceSource;
  hasStaleAuthorityFinding: boolean;
}): { genuineProductGap: boolean; reclassified: boolean; defectClass: string | null } {
  const matchesNotProvenPattern = NOT_PROVEN_BLOCKER_PATTERNS.some((p) =>
    p.test(input.blockerExplanation),
  );

  if (
    input.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
    input.hasStaleAuthorityFinding &&
    matchesNotProvenPattern
  ) {
    return {
      genuineProductGap: false,
      reclassified: true,
      defectClass: TESTING_INFRASTRUCTURE_DEFECT,
    };
  }

  if (input.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' && matchesNotProvenPattern) {
    return {
      genuineProductGap: false,
      reclassified: true,
      defectClass: TESTING_INFRASTRUCTURE_DEFECT,
    };
  }

  return { genuineProductGap: true, reclassified: false, defectClass: null };
}

function buildFinding(
  record: AuthorityEvidenceRecord,
  failureClass: AuthoritySourceFailureClass,
  staleValue: string | null,
  authoritativeValue: string | null,
  appProven: boolean,
): StaleAuthorityFinding {
  return {
    readOnly: true,
    authorityId: record.authorityId,
    authorityName: record.authorityName,
    failureClass,
    staleValue: staleValue ?? 'unknown',
    authoritativeValue,
    reclassifiedAsTestingDefect: appProven,
    detail: `${record.authorityName}: ${failureClass} (${staleValue ?? 'unknown'} vs ${authoritativeValue ?? 'authoritative'})`,
  };
}

function dedupeFindings(findings: StaleAuthorityFinding[]): StaleAuthorityFinding[] {
  const seen = new Set<string>();
  const out: StaleAuthorityFinding[] = [];
  for (const finding of findings) {
    const key = `${finding.authorityId}:${finding.failureClass}:${finding.staleValue}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finding);
  }
  return out;
}

export function computeAuthorityAgreement(records: readonly AuthorityEvidenceRecord[]): boolean {
  if (records.length === 0) return true;
  const provenCount = records.filter((r) => r.verdict === 'PROVEN').length;
  const notProvenCount = records.filter((r) => r.verdict === 'NOT_PROVEN').length;
  return notProvenCount === 0 || provenCount === 0 || notProvenCount <= Math.floor(records.length * 0.2);
}
