/**
 * Phase 27.06 — Contradiction source ranker (V1).
 */

import type {
  AuthorityEvidenceConsumption,
  FinalContradictionIsolationSummary,
  FinalContradictionRankedEntry,
} from './execution-proof-final-contradiction-isolation-types.js';
import {
  CLAIM_TO_DIMENSION,
  FINAL_STALE_CONSUMER_AUTHORITY_ID,
  FINAL_STALE_CONSUMER_AUTHORITY_NAME,
  STALE_FOUNDER_TEST_AUTHORITY_IDS,
} from './execution-proof-final-contradiction-isolation-registry.js';

const DIVERGENCE_PRIORITY: Record<string, number> = {
  AUTHORITY_STILL_USING_STALE_EVIDENCE: 0,
  STALE_PROOF_CONSUMER: 1,
  POST_CONVERGENCE_VERDICT_DRIFT: 2,
  EVIDENCE_PROPAGATION_FAILURE: 3,
  AUTHORITY_DISAGREEMENT: 4,
  ARTIFACTS_MISREPORTED_MISSING: 5,
  PROOF_STALE_VS_DISK: 6,
  NONE: 99,
};

export function rankContradictionSources(
  consumptions: readonly AuthorityEvidenceConsumption[],
): {
  rankedTable: FinalContradictionRankedEntry[];
  summary: FinalContradictionIsolationSummary;
} {
  const sorted = [...consumptions].sort((a, b) => {
    const priorityA = DIVERGENCE_PRIORITY[a.divergence] ?? 50;
    const priorityB = DIVERGENCE_PRIORITY[b.divergence] ?? 50;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.authorityName.localeCompare(b.authorityName);
  });

  const rankedTable: FinalContradictionRankedEntry[] = sorted.map((consumption, index) => ({
    readOnly: true,
    rank: index + 1,
    authority: consumption.claim ?? consumption.authorityName,
    authorityId: consumption.authorityId,
    currentVerdict: String(consumption.currentVerdict),
    expectedVerdict: String(consumption.expectedVerdict),
    rootCause: consumption.rootCause,
    divergence: consumption.divergence,
    workspaceId: consumption.consumedEvidence.workspaceId,
    runId: consumption.consumedEvidence.runId,
    manifestId: consumption.consumedEvidence.manifestId,
    proofTimestamp: consumption.consumedEvidence.proofTimestamp,
    evidenceSource: consumption.inputEvidence.sourceAuthority,
  }));

  const findByDimensionVerdict = (dimension: string, verdict: string): string | null => {
    for (const consumption of sorted) {
      const dim =
        consumption.claimId != null
          ? (CLAIM_TO_DIMENSION[consumption.claimId] ?? 'APPLICATION')
          : String(consumption.dimension);
      if (dim === dimension && String(consumption.currentVerdict).toUpperCase().includes(verdict)) {
        return consumption.authorityId;
      }
    }
    return null;
  };

  const summary: FinalContradictionIsolationSummary = {
    readOnly: true,
    firstBuildPartialAuthorityId:
      sorted.find((c) => c.claimId === 'AIDEVENGINE_BUILDS_APPLICATIONS')?.authorityId ??
      sorted.find((c) => c.claimId === 'AUTONOMOUS_BUILD_EXECUTION_PROOF')?.authorityId ??
      findByDimensionVerdict('BUILD', 'PARTIAL'),
    firstRuntimeNotProvenAuthorityId:
      sorted.find((c) =>
        ['APPLICATION_RUNS', 'APPLICATION_WORKS'].includes(c.claimId ?? ''),
      )?.authorityId ?? findByDimensionVerdict('RUNTIME', 'NOT_PROVEN'),
    firstPreviewNotProvenAuthorityId:
      sorted.find((c) => c.claimId === 'LIVE_PREVIEW_RUNS_APPLICATIONS')?.authorityId ??
      findByDimensionVerdict('PREVIEW', 'NOT_PROVEN'),
    firstLaunchNotProvenAuthorityId:
      sorted.find((c) => c.claimId === 'IDEA_TO_LAUNCH')?.authorityId ??
      sorted.find((c) => c.claimId === 'LAUNCH_READINESS_VERDICT')?.authorityId ??
      findByDimensionVerdict('LAUNCH', 'NOT_PROVEN') ??
      findByDimensionVerdict('LAUNCH', 'PARTIAL'),
    finalStaleConsumerAuthorityId: FINAL_STALE_CONSUMER_AUTHORITY_ID,
    finalStaleConsumerAuthorityName: FINAL_STALE_CONSUMER_AUTHORITY_NAME,
    contradictionCount: rankedTable.length,
  };

  return { rankedTable, summary };
}
