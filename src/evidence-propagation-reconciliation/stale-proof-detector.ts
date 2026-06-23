/**
 * Stale proof detector — stale workspace/run/manifest/cache identification (Phase 26.88).
 */

import type {
  AuthorityEvidenceSource,
  AuthoritativeRuntimeTruth,
  StaleEvidenceFinding,
} from './evidence-propagation-reconciliation-types.js';
import { KNOWN_STALE_WORKSPACE_IDS } from './evidence-propagation-reconciliation-registry.js';

function isKnownStaleWorkspace(workspaceId: string | null | undefined): boolean {
  if (!workspaceId) return false;
  return KNOWN_STALE_WORKSPACE_IDS.some(
    (stale) => stale.toLowerCase() === workspaceId.toLowerCase(),
  );
}

export function detectStaleEvidence(input: {
  authoritative: AuthoritativeRuntimeTruth;
  sources: readonly AuthorityEvidenceSource[];
}): StaleEvidenceFinding[] {
  const findings: StaleEvidenceFinding[] = [];
  const authoritativeWorkspace = input.authoritative.authoritativeWorkspaceId;
  const authoritativeRunId = input.authoritative.authoritativeRunId;

  for (const source of input.sources) {
    if (source.workspaceId && authoritativeWorkspace && source.workspaceId !== authoritativeWorkspace) {
      findings.push({
        readOnly: true,
        kind: isKnownStaleWorkspace(source.workspaceId) ? 'STALE_WORKSPACE_ID' : 'STALE_WORKSPACE_ID',
        authorityId: source.authorityId,
        staleValue: source.workspaceId,
        authoritativeValue: authoritativeWorkspace,
        detail: `${source.displayName} uses workspace ${source.workspaceId} but authoritative workspace is ${authoritativeWorkspace}`,
      });
    } else if (source.workspaceId && isKnownStaleWorkspace(source.workspaceId)) {
      findings.push({
        readOnly: true,
        kind: 'STALE_WORKSPACE_ID',
        authorityId: source.authorityId,
        staleValue: source.workspaceId,
        authoritativeValue: authoritativeWorkspace,
        detail: `${source.displayName} references known stale workspace ${source.workspaceId}`,
      });
    }

    if (
      source.runId &&
      authoritativeRunId &&
      source.runId !== authoritativeRunId &&
      source.authorityId !== 'FOUNDER_TEST_INTEGRATION'
    ) {
      findings.push({
        readOnly: true,
        kind: 'STALE_RUN_ID',
        authorityId: source.authorityId,
        staleValue: source.runId,
        authoritativeValue: authoritativeRunId,
        detail: `${source.displayName} runId ${source.runId} differs from authoritative ${authoritativeRunId}`,
      });
    }

    if (!source.consumesRuntimeBridge && input.authoritative.runtimeBridgeConsumed) {
      if (
        source.authorityId === 'FOUNDER_TRUTH_MATRIX' ||
        source.authorityId === 'LAUNCH_READINESS_PROOF' ||
        source.authorityId === 'AUTONOMOUS_BUILD_EXECUTION_PROOF'
      ) {
        findings.push({
          readOnly: true,
          kind: 'STALE_TRUTH_MATRIX_SNAPSHOT',
          authorityId: source.authorityId,
          staleValue: 'runtime-bridge-not-consumed',
          authoritativeValue: 'runtime-bridge-authoritative',
          detail: `${source.displayName} did not consume Runtime Materialization Truth Bridge`,
        });
      }
    }
  }

  return findings;
}

export function markStaleSources(
  sources: AuthorityEvidenceSource[],
  staleEvidence: readonly StaleEvidenceFinding[],
): AuthorityEvidenceSource[] {
  const staleAuthorities = new Set(staleEvidence.map((f) => f.authorityId));
  return sources.map((source) => ({
    ...source,
    evidenceStale: staleAuthorities.has(source.authorityId) || source.evidenceStale,
  }));
}
