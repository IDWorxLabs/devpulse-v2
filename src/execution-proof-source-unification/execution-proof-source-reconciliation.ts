/**
 * Phase 26.94 — Execution proof source reconciliation (V1).
 */

import type {
  AuthoritativeExecutionSource,
  ExecutionProofConsumerRecord,
  ExecutionProofSourceReconciliation,
  StaleExecutionSourceFinding,
} from './execution-proof-source-unification-types.js';
import { classifyLaunchBlockerFromStaleExecutionSource } from './stale-execution-source-detector.js';

export function reconcileExecutionProofSources(input: {
  authoritative: AuthoritativeExecutionSource;
  consumerRecords: readonly ExecutionProofConsumerRecord[];
  staleFindings: readonly StaleExecutionSourceFinding[];
  launchBlockers?: readonly { id: string; explanation: string }[];
}): ExecutionProofSourceReconciliation {
  const actions: string[] = [];
  const appProven = input.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN';

  if (input.authoritative.authoritativeWorkspaceId) {
    actions.push(`unify-workspace:${input.authoritative.authoritativeWorkspaceId}`);
  }
  if (input.authoritative.authoritativeRunId) {
    actions.push(`unify-runId:${input.authoritative.authoritativeRunId}`);
  }
  if (input.authoritative.authoritativeManifestId) {
    actions.push(`unify-manifest:${input.authoritative.authoritativeManifestId}`);
  }

  for (const finding of input.staleFindings) {
    if (finding.classification === 'STALE_WORKSPACE') {
      actions.push(`repoint-${finding.authorityId}-workspace-to-authoritative`);
    }
    if (finding.classification === 'STALE_RUNID') {
      actions.push(`repoint-${finding.authorityId}-runId-to-authoritative`);
    }
    if (finding.classification === 'STALE_MANIFEST') {
      actions.push(`repoint-${finding.authorityId}-manifest-to-authoritative`);
    }
    if (finding.classification === 'STALE_REPORT') {
      actions.push(`refresh-${finding.authorityId}-report-from-runtime-bridge`);
    }
    if (finding.classification === 'AUTHORITATIVE_SOURCE_MISMATCH') {
      actions.push(`align-${finding.authorityId}-verdict-with-runtime-truth`);
    }
  }

  if (appProven) {
    actions.push('enforce-single-authoritative-execution-chain');
  }

  let staleOnlyBlockersReclassified = 0;
  let genuineProductGapBlockers = 0;

  for (const blocker of input.launchBlockers ?? []) {
    const classification = classifyLaunchBlockerFromStaleExecutionSource({
      blockerExplanation: blocker.explanation,
      authoritative: input.authoritative,
      hasStaleFinding: input.staleFindings.length > 0,
    });
    if (classification.reclassified) staleOnlyBlockersReclassified += 1;
    else genuineProductGapBlockers += 1;
  }

  const conflictingSourceCount = input.consumerRecords.filter(
    (r) => r.classification === 'MULTIPLE_SOURCE_CONFLICT',
  ).length;

  const singleAuthoritativeChain =
    appProven &&
    Boolean(input.authoritative.authoritativeWorkspaceId) &&
    Boolean(input.authoritative.authoritativeRunId) &&
    conflictingSourceCount === 0;

  return {
    readOnly: true,
    unifiedWorkspaceId: input.authoritative.authoritativeWorkspaceId,
    unifiedRunId: input.authoritative.authoritativeRunId,
    unifiedManifestId: input.authoritative.authoritativeManifestId,
    singleAuthoritativeChain,
    staleOnlyBlockersReclassified,
    genuineProductGapBlockers,
    conflictingSourceCount,
    actions: actions.length ? actions : ['no-reconciliation-actions-required'],
  };
}
