/**
 * Phase 27.00 — Authority reality convergence reconciliation (V1).
 */

import { classifyLaunchBlockerFromStaleExecutionSource } from '../execution-proof-source-unification/stale-execution-source-detector.js';
import { AUTHORITY_DISAGREEMENT_PATTERNS } from './authority-reality-convergence-registry.js';
import {
  detectCachedVerdictConsumers,
  detectStaleProofConsumers,
  detectStaleReportConsumers,
} from './stale-consumer-detector.js';
import type {
  AuthoritativeRealitySource,
  AuthorityRealityConvergenceReconciliation,
  AuthorityRealityDivergence,
  LaunchCriticalAuthorityTrace,
  RealityAuditFinding,
} from './authority-reality-convergence-types.js';

export function reconcileAuthorityReality(input: {
  authoritative: AuthoritativeRealitySource;
  launchCriticalTraces: readonly LaunchCriticalAuthorityTrace[];
  divergences: readonly AuthorityRealityDivergence[];
  auditFindings: readonly RealityAuditFinding[];
  launchBlockers?: readonly { id: string; explanation: string }[];
}): AuthorityRealityConvergenceReconciliation {
  const actions: string[] = [];

  if (input.authoritative.authoritativeWorkspaceId) {
    actions.push(`converge-workspace:${input.authoritative.authoritativeWorkspaceId}`);
  }
  if (input.authoritative.authoritativeRunId) {
    actions.push(`converge-runId:${input.authoritative.authoritativeRunId}`);
  }
  if (input.authoritative.authoritativeManifestId) {
    actions.push(`converge-manifest:${input.authoritative.authoritativeManifestId}`);
  }
  if (input.authoritative.authoritativeProofTimestamp) {
    actions.push(`converge-proofTimestamp:${input.authoritative.authoritativeProofTimestamp}`);
  }

  for (const trace of input.launchCriticalTraces.filter((t) => !t.alignedWithAuthoritative)) {
    for (const kind of trace.divergenceKinds) {
      actions.push(`repair-${trace.authorityId}-${kind.toLowerCase()}`);
    }
    if (!trace.consumesRuntimeBridge) {
      actions.push(`repoint-${trace.authorityId}-to-runtime-bridge`);
    }
  }

  for (const divergence of input.divergences) {
    if (divergence.divergenceReason === 'ARTIFACTS_MISREPORTED') {
      actions.push('reclassify-artifacts-misreported-as-testing-defect');
    }
    if (divergence.divergenceReason === 'CACHED_VERDICT_CONSUMER') {
      actions.push('refresh-cached-verdict-from-authoritative-chain');
    }
  }

  if (input.authoritative.diskMissingArtifacts === 0 && input.authoritative.diskExistingArtifacts > 0) {
    actions.push('enforce-disk-evidence-over-stale-missing-artifact-claims');
  }

  let staleOnlyBlockersReclassified = 0;
  let genuineProductGapBlockers = 0;

  for (const blocker of input.launchBlockers ?? []) {
    const matchesDisagreement = AUTHORITY_DISAGREEMENT_PATTERNS.some((p) => p.test(blocker.explanation));
    const staleClassification = classifyLaunchBlockerFromStaleExecutionSource({
      blockerExplanation: blocker.explanation,
      authoritative: input.authoritative,
      hasStaleFinding: input.divergences.length > 0,
    });

    if (
      matchesDisagreement ||
      (staleClassification.reclassified &&
        input.authoritative.diskMissingArtifacts === 0 &&
        /missing artifacts|NOT_PROVEN|PROOF_STALE|ARTIFACTS_MISREPORTED/i.test(blocker.explanation))
    ) {
      staleOnlyBlockersReclassified += 1;
    } else if (staleClassification.reclassified) {
      staleOnlyBlockersReclassified += 1;
    } else {
      genuineProductGapBlockers += 1;
    }
  }

  const allLaunchCriticalAligned = input.launchCriticalTraces.every((t) => t.alignedWithAuthoritative);

  return {
    readOnly: true,
    convergedWorkspaceId: input.authoritative.authoritativeWorkspaceId,
    convergedRunId: input.authoritative.authoritativeRunId,
    convergedManifestId: input.authoritative.authoritativeManifestId,
    convergedProofTimestamp: input.authoritative.authoritativeProofTimestamp,
    staleConsumersRepaired: detectStaleProofConsumers({ auditFindings: input.auditFindings }),
    cachedVerdictConsumersRepaired: detectCachedVerdictConsumers({ auditFindings: input.auditFindings }),
    staleReportConsumersRepaired: detectStaleReportConsumers({ auditFindings: input.auditFindings }),
    artifactsMisreportReclassified: input.divergences.filter(
      (d) => d.divergenceReason === 'ARTIFACTS_MISREPORTED',
    ).length,
    staleOnlyBlockersReclassified,
    genuineProductGapBlockers,
    allLaunchCriticalAligned,
    actions: actions.length ? actions : ['no-convergence-actions-required'],
  };
}
