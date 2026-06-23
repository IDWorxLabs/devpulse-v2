/**
 * Phase 26.91 — Authority workspace source auditor (V1).
 */

import type {
  AuthorityEvidenceRecord,
  AuthoritativeEvidenceSource,
} from './authority-evidence-source-realignment-types.js';
import { KNOWN_STALE_WORKSPACE_IDS } from '../evidence-propagation-reconciliation/evidence-propagation-reconciliation-registry.js';

export function auditAuthorityWorkspaceSources(input: {
  records: AuthorityEvidenceRecord[];
  authoritative: AuthoritativeEvidenceSource;
}): AuthorityEvidenceRecord[] {
  const { authoritative } = input;

  return input.records.map((record) => {
    const workspaceStale =
      Boolean(
        record.workspaceId &&
          authoritative.authoritativeWorkspaceId &&
          record.workspaceId !== authoritative.authoritativeWorkspaceId,
      ) ||
      Boolean(record.workspaceId && isKnownStaleWorkspace(record.workspaceId));

    let failureClass = record.failureClass;
    if (workspaceStale && failureClass === 'NONE') {
      failureClass = 'STALE_WORKSPACE';
    }

    return {
      ...record,
      workspaceStale,
      evidenceStale: record.evidenceStale || workspaceStale,
      failureClass,
      blocksLaunchFromStaleEvidence:
        record.blocksLaunchFromStaleEvidence ||
        (workspaceStale && record.verdict === 'NOT_PROVEN'),
    };
  });
}

export function isKnownStaleWorkspace(workspaceId: string): boolean {
  return KNOWN_STALE_WORKSPACE_IDS.some(
    (stale) => stale.toLowerCase() === workspaceId.toLowerCase(),
  );
}

export function resolveAuthoritativeWorkspaceId(input: {
  runtimeWorkspaceId?: string | null;
  buildWorkspaceId?: string | null;
  founderFlowWorkspaceId?: string | null;
}): string | null {
  return (
    input.founderFlowWorkspaceId ??
    input.runtimeWorkspaceId ??
    input.buildWorkspaceId ??
    null
  );
}
