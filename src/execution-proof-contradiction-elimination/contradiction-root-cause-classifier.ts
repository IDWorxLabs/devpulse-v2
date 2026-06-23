/**
 * Phase 27.01 — Contradiction root cause classifier (V1).
 */

import { CONTRADICTORY_VERDICTS } from './execution-proof-contradiction-elimination-registry.js';
import type {
  AuthoritativeContradictionContext,
  AuthorityVerdictTrace,
  ContradictionRootCause,
  ContradictionReclassification,
} from './execution-proof-contradiction-elimination-types.js';
import { traceManifestSource } from './manifest-source-tracer.js';
import { traceRunIdSource } from './runid-source-tracer.js';
import { traceTimestampSource } from './timestamp-source-tracer.js';
import { traceWorkspaceSource } from './workspace-source-tracer.js';

export function isContradictoryVerdict(verdict: string): boolean {
  const normalized = verdict.toUpperCase();
  return CONTRADICTORY_VERDICTS.some((v) => normalized.includes(v));
}

export function expectedVerdictForDimension(
  dimension: AuthorityVerdictTrace['dimension'],
): string {
  switch (dimension) {
    case 'BUILD':
    case 'RUNTIME':
    case 'PREVIEW':
    case 'VERIFY':
    case 'LAUNCH':
    case 'APPLICATION':
      return 'PROVEN';
    default:
      return 'PROVEN';
  }
}

export function classifyContradictionRootCause(input: {
  trace: AuthorityVerdictTrace;
  authoritative: AuthoritativeContradictionContext;
}): ContradictionRootCause {
  const workspace = traceWorkspaceSource({
    workspaceId: input.trace.workspaceId,
    authoritativeWorkspaceId: input.authoritative.authoritativeWorkspaceId,
    authorityId: input.trace.authorityId,
  });
  const runId = traceRunIdSource({
    runId: input.trace.runId,
    authoritativeRunId: input.authoritative.authoritativeRunId,
    authorityId: input.trace.authorityId,
  });
  const manifest = traceManifestSource({
    manifestId: input.trace.manifestId,
    authoritativeManifestId: input.authoritative.authoritativeManifestId,
    authorityId: input.trace.authorityId,
  });
  const timestamp = traceTimestampSource({
    proofTimestamp: input.trace.proofTimestamp,
    authoritativeProofTimestamp: input.authoritative.authoritativeProofTimestamp,
    authorityId: input.trace.authorityId,
    consumesRuntimeBridge: input.trace.consumesRuntimeBridge,
  });

  if (workspace.stale || !workspace.aligned) return 'STALE_WORKSPACE_REFERENCE';
  if (runId.stale || !runId.aligned) return 'STALE_RUNID_REFERENCE';
  if (manifest.stale || !manifest.aligned) return 'STALE_MANIFEST_REFERENCE';
  if (timestamp.stale || !timestamp.aligned) return 'STALE_REPORT_REFERENCE';

  if (/cached|stale markdown|historical/i.test(input.trace.sourceChain)) {
    return 'STALE_VERDICT_CACHE';
  }

  if (
    input.authoritative.convergencePassed &&
    input.authoritative.unificationPassed &&
    !input.trace.consumesRuntimeBridge
  ) {
    return 'POST_CONVERGENCE_VERDICT_DRIFT';
  }

  if (!input.trace.consumesRuntimeBridge && input.authoritative.applicationProven) {
    return 'AUTHORITY_REEVALUATION_FAILURE';
  }

  if (/ARTIFACTS_MISREPORTED|PROOF_STALE|EVIDENCE_PROPAGATION/i.test(input.trace.detail)) {
    return 'EVIDENCE_PROPAGATION_FAILURE';
  }

  if (
    input.authoritative.applicationProven &&
    input.authoritative.diskMissingArtifacts === 0
  ) {
    return 'STALE_VERDICT_CACHE';
  }

  return 'UNKNOWN';
}

export function reclassifyContradiction(input: {
  rootCause: ContradictionRootCause;
  authoritative: AuthoritativeContradictionContext;
  trace: AuthorityVerdictTrace;
}): ContradictionReclassification {
  if (input.rootCause === 'REAL_PRODUCT_GAP') {
    return 'REAL_PRODUCT_GAP';
  }

  if (
    input.authoritative.applicationProven &&
    input.authoritative.diskMissingArtifacts === 0
  ) {
    return 'TESTING_INFRASTRUCTURE_DEFECT';
  }

  if (
    input.rootCause === 'STALE_VERDICT_CACHE' ||
    input.rootCause === 'STALE_WORKSPACE_REFERENCE' ||
    input.rootCause === 'STALE_RUNID_REFERENCE' ||
    input.rootCause === 'STALE_MANIFEST_REFERENCE' ||
    input.rootCause === 'STALE_REPORT_REFERENCE' ||
    input.rootCause === 'POST_CONVERGENCE_VERDICT_DRIFT' ||
    input.rootCause === 'AUTHORITY_REEVALUATION_FAILURE' ||
    input.rootCause === 'EVIDENCE_PROPAGATION_FAILURE' ||
    input.rootCause === 'UNKNOWN'
  ) {
    return 'TESTING_INFRASTRUCTURE_DEFECT';
  }

  return 'REAL_PRODUCT_GAP';
}

export function buildEvidencePath(input: {
  trace: AuthorityVerdictTrace;
  authoritative: AuthoritativeContradictionContext;
}): string {
  return [
    `disk=${input.authoritative.diskMissingArtifacts === 0 ? 'PROVEN' : 'PARTIAL'}`,
    `runtimeBridge=${input.authoritative.runtimeBridgeVerdict}`,
    `authority=${input.trace.verdict}`,
    `source=${input.trace.sourceChain}`,
  ].join('; ');
}
