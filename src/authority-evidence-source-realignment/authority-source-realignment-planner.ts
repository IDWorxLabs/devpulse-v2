/**
 * Phase 26.91 — Authority source realignment planner (V1).
 */

import type {
  AuthorityEvidenceRecord,
  AuthoritySourceRealignmentPlan,
  AuthoritativeEvidenceSource,
  StaleAuthorityFinding,
} from './authority-evidence-source-realignment-types.js';

export function planAuthoritySourceRealignment(input: {
  authoritative: AuthoritativeEvidenceSource;
  records: readonly AuthorityEvidenceRecord[];
  staleFindings: readonly StaleAuthorityFinding[];
  staleLaunchBlockerCount: number;
}): AuthoritySourceRealignmentPlan {
  const actions: string[] = [];
  const staleAuthorities = new Set(input.staleFindings.map((f) => f.authorityId));

  if (input.authoritative.authoritativeWorkspaceId) {
    actions.push(`set-authoritative-workspace:${input.authoritative.authoritativeWorkspaceId}`);
  }
  if (input.authoritative.authoritativeRunId) {
    actions.push(`set-authoritative-runId:${input.authoritative.authoritativeRunId}`);
  }

  for (const finding of input.staleFindings) {
    if (finding.failureClass === 'STALE_WORKSPACE') {
      actions.push(`realign-workspace:${finding.authorityId}`);
    }
    if (finding.failureClass === 'STALE_RUNID') {
      actions.push(`realign-runId:${finding.authorityId}`);
    }
    if (finding.failureClass === 'STALE_MANIFEST') {
      actions.push(`realign-manifest:${finding.authorityId}`);
    }
    if (finding.failureClass === 'STALE_REPORT') {
      actions.push(`realign-report:${finding.authorityId}`);
    }
    if (finding.failureClass === 'AUTHORITATIVE_TRUTH_IGNORED') {
      actions.push(`inject-runtime-bridge:${finding.authorityId}`);
    }
  }

  if (input.staleLaunchBlockerCount > 0) {
    actions.push(`reclassify-blockers:TESTING_INFRASTRUCTURE_DEFECT:${input.staleLaunchBlockerCount}`);
  }

  const realignmentRequired =
    input.staleFindings.length > 0 ||
    input.staleLaunchBlockerCount > 0 ||
    input.records.some((r) => r.blocksLaunchFromStaleEvidence);

  return {
    readOnly: true,
    realignmentRequired,
    authoritativeWorkspaceId: input.authoritative.authoritativeWorkspaceId,
    authoritativeRunId: input.authoritative.authoritativeRunId,
    actions,
    staleAuthorityCount: staleAuthorities.size,
    staleLaunchBlockerCount: input.staleLaunchBlockerCount,
    reason: realignmentRequired
      ? `${staleAuthorities.size} stale authorities; ${input.staleLaunchBlockerCount} stale launch blockers`
      : 'All authorities aligned to authoritative runtime proof',
  };
}
