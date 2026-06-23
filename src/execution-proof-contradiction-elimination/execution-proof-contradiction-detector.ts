/**
 * Phase 27.01 — Execution proof contradiction detector (V1).
 */

import {
  classifyContradictionRootCause,
  buildEvidencePath,
  expectedVerdictForDimension,
  isContradictoryVerdict,
  reclassifyContradiction,
} from './contradiction-root-cause-classifier.js';
import type {
  AuthoritativeContradictionContext,
  AuthorityVerdictTrace,
  ExecutionProofContradiction,
  ExecutionProofContradictionElimination,
  ExecutionProofDimension,
} from './execution-proof-contradiction-elimination-types.js';
import { traceManifestSource } from './manifest-source-tracer.js';
import { traceRunIdSource } from './runid-source-tracer.js';
import { traceTimestampSource } from './timestamp-source-tracer.js';
import { traceWorkspaceSource } from './workspace-source-tracer.js';

function sourcesAligned(input: {
  trace: AuthorityVerdictTrace;
  authoritative: AuthoritativeContradictionContext;
}): boolean {
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

  return (
    (workspace.aligned || input.trace.consumesRuntimeBridge) &&
    (runId.aligned || input.trace.consumesRuntimeBridge || !input.trace.runId) &&
    manifest.aligned &&
    (timestamp.aligned || input.trace.consumesRuntimeBridge)
  );
}

export function detectExecutionProofContradictions(input: {
  traces: readonly AuthorityVerdictTrace[];
  authoritative: AuthoritativeContradictionContext;
}): ExecutionProofContradiction[] {
  if (!input.authoritative.applicationProven) return [];

  const contradictions: ExecutionProofContradiction[] = [];
  const seen = new Set<string>();

  for (const trace of input.traces) {
    if (!isContradictoryVerdict(String(trace.verdict))) continue;
    if (input.authoritative.diskMissingArtifacts !== 0) continue;
    if (!sourcesAligned({ trace, authoritative: input.authoritative })) continue;

    const key = `${trace.authorityId}:${trace.dimension}:${trace.verdict}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const rootCause = classifyContradictionRootCause({ trace, authoritative: input.authoritative });
    const reclassification = reclassifyContradiction({ rootCause, authoritative: input.authoritative, trace });

    contradictions.push({
      readOnly: true,
      authorityId: trace.authorityId,
      authorityName: trace.authorityName,
      dimension: trace.dimension,
      workspaceId: trace.workspaceId,
      runId: trace.runId,
      manifestId: trace.manifestId,
      proofTimestamp: trace.proofTimestamp,
      verdict: String(trace.verdict),
      expectedVerdict: expectedVerdictForDimension(trace.dimension),
      rootCause,
      reclassification,
      evidencePath: buildEvidencePath({ trace, authoritative: input.authoritative }),
      detail: trace.detail,
    });
  }

  return contradictions;
}

export function planContradictionElimination(input: {
  contradictions: readonly ExecutionProofContradiction[];
  authoritative: AuthoritativeContradictionContext;
}): ExecutionProofContradictionElimination {
  const actions: string[] = [];

  for (const contradiction of input.contradictions) {
    actions.push(
      `eliminate-${contradiction.authorityId}-${contradiction.dimension.toLowerCase()}-${contradiction.rootCause.toLowerCase()}`,
    );
    if (contradiction.reclassification === 'TESTING_INFRASTRUCTURE_DEFECT') {
      actions.push(`reclassify-${contradiction.authorityId}-as-testing-defect`);
    }
  }

  if (
    input.authoritative.applicationProven &&
    input.authoritative.diskMissingArtifacts === 0
  ) {
    actions.push('suppress-truth-matrix-artifacts-misreported-when-disk-proven');
    actions.push('suppress-truth-matrix-proof-stale-vs-disk-when-runtime-proven');
  }

  const findByDimension = (dimension: ExecutionProofDimension, verdict: string) =>
    input.contradictions.find(
      (c) => c.dimension === dimension && c.verdict.toUpperCase().includes(verdict),
    )?.authorityId ?? null;

  const infrastructureDefectCount = input.contradictions.filter(
    (c) => c.reclassification === 'TESTING_INFRASTRUCTURE_DEFECT',
  ).length;
  const genuineProductGapCount = input.contradictions.filter(
    (c) => c.reclassification === 'REAL_PRODUCT_GAP',
  ).length;

  return {
    readOnly: true,
    contradictionsEliminated: input.contradictions.length,
    infrastructureDefectCount,
    genuineProductGapCount,
    buildPartialAuthorityId: findByDimension('BUILD', 'PARTIAL'),
    runtimeNotProvenAuthorityId: findByDimension('RUNTIME', 'NOT_PROVEN'),
    previewNotProvenAuthorityId: findByDimension('PREVIEW', 'NOT_PROVEN'),
    launchNotProvenAuthorityId: findByDimension('LAUNCH', 'NOT_PROVEN'),
    truthMatrixMisreportSuppressed:
      input.authoritative.applicationProven && input.authoritative.diskMissingArtifacts === 0,
    actions: actions.length ? actions : ['no-contradiction-elimination-actions-required'],
  };
}
