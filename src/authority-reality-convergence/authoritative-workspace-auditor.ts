/**
 * Phase 27.00 — Authoritative workspace auditor (V1).
 */

import {
  describeWorkspaceSource,
  isStaleExecutionWorkspace,
} from '../execution-proof-source-unification/authoritative-workspace-resolver.js';
import type { ExecutionProofConsumerRecord } from '../execution-proof-source-unification/execution-proof-source-unification-types.js';
import type { AuthoritativeRealitySource, RealityAuditFinding } from './authority-reality-convergence-types.js';

export function auditAuthoritativeWorkspace(input: {
  authoritative: AuthoritativeRealitySource;
  consumerRecords: readonly ExecutionProofConsumerRecord[];
}): RealityAuditFinding[] {
  const findings: RealityAuditFinding[] = [];

  for (const record of input.consumerRecords) {
    const workspaceMismatch = Boolean(
      record.workspaceId &&
        input.authoritative.authoritativeWorkspaceId &&
        record.workspaceId !== input.authoritative.authoritativeWorkspaceId,
    );
    const staleWorkspace = isStaleExecutionWorkspace(record.workspaceId);
    const aligned =
      !workspaceMismatch &&
      !staleWorkspace &&
      (record.workspaceId === input.authoritative.authoritativeWorkspaceId ||
        (!record.workspaceId && record.consumesRuntimeBridge));

    findings.push({
      readOnly: true,
      auditKind: 'workspace',
      authorityId: record.authorityId,
      authorityName: record.authorityName,
      consumerValue: record.workspaceId,
      authoritativeValue: input.authoritative.authoritativeWorkspaceId,
      aligned,
      consumerKind: workspaceMismatch
        ? 'WORKSPACE_MISMATCH'
        : staleWorkspace
          ? 'STALE_PROOF_CONSUMER'
          : null,
      detail: describeWorkspaceSource({
        workspaceId: record.workspaceId,
        authoritativeWorkspaceId: input.authoritative.authoritativeWorkspaceId,
        dataSource: record.authorityId,
      }),
    });
  }

  return findings;
}
