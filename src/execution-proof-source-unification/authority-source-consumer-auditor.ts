/**
 * Phase 26.94 — Authority source consumer auditor (V1).
 */

import type { AuthorityEvidenceSource } from '../evidence-propagation-reconciliation/evidence-propagation-reconciliation-types.js';
import {
  describeWorkspaceSource,
  isStaleExecutionWorkspace,
} from './authoritative-workspace-resolver.js';
import { describeRunIdSource } from './authoritative-runid-resolver.js';
import { EXECUTION_PROOF_AUDIT_TARGETS } from './execution-proof-source-unification-registry.js';
import type {
  AuthoritativeExecutionSource,
  ExecutionProofConsumerRecord,
  ExecutionProofSourceClassification,
} from './execution-proof-source-unification-types.js';

const DISPLAY_NAMES: Record<string, string> = {
  FOUNDER_TEST_INTEGRATION: 'Founder Test Integration',
  FOUNDER_EXECUTION_PROOF: 'Founder Execution Proof',
  AUTONOMOUS_BUILD_EXECUTION_PROOF: 'Autonomous Build Execution Proof',
  CONNECTED_BUILD_EXECUTION: 'Connected Build Execution',
  CONNECTED_RUNTIME_ACTIVATION: 'Runtime Activation Proof',
  CONNECTED_PREVIEW_EXPERIENCE: 'Preview Experience Proof',
  CONNECTED_VERIFICATION_EXECUTION: 'Verification Execution Proof',
  CONNECTED_LAUNCH_READINESS: 'Launch Readiness Proof',
  FOUNDER_TRUTH_MATRIX: 'Founder Truth Matrix',
  LAUNCH_COUNCIL: 'Launch Council',
};

function extractManifestFromDetail(detail: string): string | null {
  const match =
    detail.match(/manifest[:=\s]+([a-zA-Z0-9_-]+)/i) ??
    detail.match(/build-manifest-([a-zA-Z0-9_-]+)/i);
  return match?.[1] ?? null;
}

function classifyConsumer(input: {
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  reportTimestamp: string | null;
  authoritative: AuthoritativeExecutionSource;
  verdict: string;
  consumesRuntimeBridge: boolean;
}): ExecutionProofSourceClassification {
  if (!input.workspaceId && !input.runId && !input.manifestId && !input.reportTimestamp) {
    return 'SOURCE_NOT_DISCOVERABLE';
  }

  const workspaceStale =
    Boolean(
      input.workspaceId &&
        input.authoritative.authoritativeWorkspaceId &&
        input.workspaceId !== input.authoritative.authoritativeWorkspaceId,
    ) || isStaleExecutionWorkspace(input.workspaceId);

  const runIdStale = Boolean(
    input.runId &&
      input.authoritative.authoritativeRunId &&
      input.runId !== input.authoritative.authoritativeRunId,
  );

  const manifestStale = Boolean(
    input.manifestId &&
      input.authoritative.authoritativeManifestId &&
      input.manifestId !== input.authoritative.authoritativeManifestId,
  );

  const reportStale = Boolean(
    input.reportTimestamp &&
      input.authoritative.authoritativeReportTimestamp &&
      input.reportTimestamp < input.authoritative.authoritativeReportTimestamp,
  );

  const conflicts = [workspaceStale, runIdStale, manifestStale, reportStale].filter(Boolean).length;
  if (conflicts > 1) return 'MULTIPLE_SOURCE_CONFLICT';
  if (workspaceStale) return 'STALE_WORKSPACE';
  if (runIdStale) return 'STALE_RUNID';
  if (manifestStale) return 'STALE_MANIFEST';
  if (reportStale) return 'STALE_REPORT';

  if (
    input.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
    input.verdict === 'NOT_PROVEN' &&
    !input.consumesRuntimeBridge
  ) {
    return 'AUTHORITATIVE_SOURCE_MISMATCH';
  }

  if (
    input.workspaceId === input.authoritative.authoritativeWorkspaceId &&
    (!input.runId || input.runId === input.authoritative.authoritativeRunId)
  ) {
    return 'AUTHORITATIVE_SOURCE';
  }

  return input.consumesRuntimeBridge ? 'AUTHORITATIVE_SOURCE' : 'AUTHORITATIVE_SOURCE_MISMATCH';
}

function extractReportTimestampFromDetail(detail: string): string | null {
  const match = detail.match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/);
  return match?.[0] ?? null;
}

function mapSourceToConsumer(
  source: AuthorityEvidenceSource,
  authoritative: AuthoritativeExecutionSource,
): ExecutionProofConsumerRecord {
  const manifestId = extractManifestFromDetail(source.detail);
  const reportTimestamp = extractReportTimestampFromDetail(source.detail);
  const classification = classifyConsumer({
    workspaceId: source.workspaceId,
    runId: source.runId,
    manifestId,
    reportTimestamp,
    authoritative,
    verdict: source.applicationVerdict,
    consumesRuntimeBridge: source.consumesRuntimeBridge,
  });

  const staleEvidence = classification !== 'AUTHORITATIVE_SOURCE';
  const appProven = authoritative.finalApplicationTruth === 'APPLICATION_PROVEN';

  return {
    readOnly: true,
    authorityId: source.authorityId,
    authorityName: source.displayName,
    workspaceId: source.workspaceId,
    runId: source.runId,
    manifestId,
    reportTimestamp,
    workspaceSource: describeWorkspaceSource({
      workspaceId: source.workspaceId,
      authoritativeWorkspaceId: authoritative.authoritativeWorkspaceId,
      dataSource: source.authorityId,
    }),
    runIdSource: describeRunIdSource({
      runId: source.runId,
      authoritativeRunId: authoritative.authoritativeRunId,
      dataSource: source.authorityId,
    }),
    manifestSource: manifestId ? `manifest (${manifestId})` : 'SOURCE_NOT_DISCOVERABLE',
    reportSource: source.consumesRuntimeBridge ? 'live runtime truth' : 'cached authority snapshot',
    verdict: source.applicationVerdict,
    consumesRuntimeBridge: source.consumesRuntimeBridge,
    classification,
    staleEvidence,
    contradictsAuthoritativeTruth:
      appProven && source.applicationVerdict === 'NOT_PROVEN' && staleEvidence,
    reclassifiedAsTestingDefect:
      appProven && staleEvidence && source.applicationVerdict === 'NOT_PROVEN',
    detail: source.detail,
  };
}

function buildMissingConsumer(
  authorityId: string,
  authoritative: AuthoritativeExecutionSource,
): ExecutionProofConsumerRecord {
  return {
    readOnly: true,
    authorityId,
    authorityName: DISPLAY_NAMES[authorityId] ?? authorityId.replace(/_/g, ' '),
    workspaceId: null,
    runId: authoritative.authoritativeRunId,
    manifestId: authoritative.authoritativeManifestId,
    reportTimestamp: authoritative.authoritativeReportTimestamp,
    workspaceSource: 'SOURCE_NOT_DISCOVERABLE',
    runIdSource: authoritative.authoritativeRunId ? 'active founder run' : 'SOURCE_NOT_DISCOVERABLE',
    manifestSource: authoritative.authoritativeManifestId
      ? `manifest (${authoritative.authoritativeManifestId})`
      : 'SOURCE_NOT_DISCOVERABLE',
    reportSource: authoritative.runtimeBridgeConsumed ? 'live runtime truth' : 'stale markdown report',
    verdict: 'UNKNOWN',
    consumesRuntimeBridge: false,
    classification: 'SOURCE_NOT_DISCOVERABLE',
    staleEvidence: true,
    contradictsAuthoritativeTruth: false,
    reclassifiedAsTestingDefect: false,
    detail: `${authorityId} consumer record not discovered in authority scan`,
  };
}

export function auditAuthoritySourceConsumers(input: {
  sources: readonly AuthorityEvidenceSource[];
  authoritative: AuthoritativeExecutionSource;
}): ExecutionProofConsumerRecord[] {
  const byId = new Map(input.sources.map((s) => [s.authorityId, s]));
  const records: ExecutionProofConsumerRecord[] = [];

  for (const authorityId of EXECUTION_PROOF_AUDIT_TARGETS) {
    const source = byId.get(authorityId);
    if (source) {
      records.push(mapSourceToConsumer(source, input.authoritative));
    } else {
      records.push(buildMissingConsumer(authorityId, input.authoritative));
    }
  }

  return records;
}

export function computeExecutionProofSourceAgreement(
  records: readonly ExecutionProofConsumerRecord[],
): boolean {
  if (!records.length) return true;
  const authoritativeCount = records.filter((r) => r.classification === 'AUTHORITATIVE_SOURCE').length;
  const staleCount = records.filter((r) => r.staleEvidence).length;
  return staleCount === 0 || authoritativeCount >= Math.ceil(records.length * 0.6);
}
