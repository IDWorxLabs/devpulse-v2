/**
 * Phase 27.00 — Launch-critical authority tracer (V1).
 */

import type { ExecutionProofConsumerRecord } from '../execution-proof-source-unification/execution-proof-source-unification-types.js';
import {
  LAUNCH_CRITICAL_AUTHORITY_TARGETS,
  LAUNCH_CRITICAL_DISPLAY_NAMES,
} from './authority-reality-convergence-registry.js';
import type {
  AuthoritativeRealitySource,
  LaunchCriticalAuthorityTrace,
  RealityAuditFinding,
  RealityConsumerKind,
} from './authority-reality-convergence-types.js';

function collectDivergenceKinds(
  authorityId: string,
  auditFindings: readonly RealityAuditFinding[],
): RealityConsumerKind[] {
  const kinds = new Set<RealityConsumerKind>();
  for (const finding of auditFindings) {
    if (finding.authorityId !== authorityId) continue;
    if (!finding.aligned && finding.consumerKind) {
      kinds.add(finding.consumerKind);
    }
  }
  return [...kinds];
}

function buildMissingTrace(
  authorityId: (typeof LAUNCH_CRITICAL_AUTHORITY_TARGETS)[number],
  authoritative: AuthoritativeRealitySource,
): LaunchCriticalAuthorityTrace {
  return {
    readOnly: true,
    authorityId,
    authorityName: LAUNCH_CRITICAL_DISPLAY_NAMES[authorityId],
    workspaceId: null,
    runId: authoritative.authoritativeRunId,
    manifestId: authoritative.authoritativeManifestId,
    proofTimestamp: authoritative.authoritativeProofTimestamp,
    verdict: 'UNKNOWN',
    consumesRuntimeBridge: false,
    alignedWithAuthoritative: false,
    divergenceKinds: ['STALE_PROOF_CONSUMER'],
    detail: `${authorityId} not discovered in authority scan — repoint to authoritative chain`,
  };
}

export function traceLaunchCriticalAuthorities(input: {
  authoritative: AuthoritativeRealitySource;
  consumerRecords: readonly ExecutionProofConsumerRecord[];
  auditFindings: readonly RealityAuditFinding[];
}): LaunchCriticalAuthorityTrace[] {
  const byId = new Map(input.consumerRecords.map((r) => [r.authorityId, r]));
  const traces: LaunchCriticalAuthorityTrace[] = [];

  for (const authorityId of LAUNCH_CRITICAL_AUTHORITY_TARGETS) {
    const record = byId.get(authorityId);
    if (!record) {
      traces.push(buildMissingTrace(authorityId, input.authoritative));
      continue;
    }

    const divergenceKinds = collectDivergenceKinds(authorityId, input.auditFindings);
    const dimensionAligned =
      record.workspaceId === input.authoritative.authoritativeWorkspaceId ||
      record.consumesRuntimeBridge ||
      !record.workspaceId;
    const runAligned =
      record.runId === input.authoritative.authoritativeRunId ||
      record.consumesRuntimeBridge ||
      !record.runId;
    const manifestAligned =
      record.manifestId === input.authoritative.authoritativeManifestId ||
      !record.manifestId;
    const proofAligned =
      record.consumesRuntimeBridge ||
      !record.reportTimestamp ||
      record.reportTimestamp >= (input.authoritative.authoritativeProofTimestamp ?? '');

    const alignedWithAuthoritative =
      divergenceKinds.length === 0 &&
      dimensionAligned &&
      runAligned &&
      manifestAligned &&
      proofAligned &&
      (record.classification === 'AUTHORITATIVE_SOURCE' || record.consumesRuntimeBridge);

    traces.push({
      readOnly: true,
      authorityId,
      authorityName: LAUNCH_CRITICAL_DISPLAY_NAMES[authorityId],
      workspaceId: record.workspaceId,
      runId: record.runId,
      manifestId: record.manifestId,
      proofTimestamp: record.reportTimestamp,
      verdict: record.verdict,
      consumesRuntimeBridge: record.consumesRuntimeBridge,
      alignedWithAuthoritative,
      divergenceKinds,
      detail: record.detail,
    });
  }

  return traces;
}

export function computeLaunchCriticalAlignment(
  traces: readonly LaunchCriticalAuthorityTrace[],
): boolean {
  return traces.length > 0 && traces.every((t) => t.alignedWithAuthoritative);
}
