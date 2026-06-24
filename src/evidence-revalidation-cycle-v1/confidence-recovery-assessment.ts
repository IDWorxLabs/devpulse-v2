/**
 * Evidence Revalidation Cycle V1 — confidence recovery assessment.
 */

import type { OperationalEvidenceFreshnessAssessment } from '../operational-evidence-freshness-authority-v1/operational-evidence-freshness-v1-types.js';
import type {
  ConfidenceRecoveryAssessment,
  ConfidenceRecoveryEntry,
  FreshnessUpdateEntry,
  RevalidationResultEntry,
} from './evidence-revalidation-cycle-v1-types.js';

function confidenceFromFreshness(freshnessScore: number, status: string): number {
  if (status === 'REFRESHED' || status === 'FRESH') return Math.min(100, freshnessScore);
  if (status === 'AGING') return Math.round(freshnessScore * 0.9);
  if (status === 'STALE') return Math.round(freshnessScore * 0.75);
  return Math.round(freshnessScore * 0.5);
}

export function buildConfidenceRecoveryAssessment(input: {
  oefa: OperationalEvidenceFreshnessAssessment;
  results: readonly RevalidationResultEntry[];
  freshnessUpdates: readonly FreshnessUpdateEntry[];
  generatedAt: string;
}): ConfidenceRecoveryAssessment {
  const oefaByEvidence = new Map(
    input.oefa.registry.records.map((r) => [r.evidenceId, r]),
  );

  const entries: ConfidenceRecoveryEntry[] = input.results.map((result) => {
    const oefaRecord = oefaByEvidence.get(result.evidenceId);
    const update = input.freshnessUpdates.find((u) => u.evidenceId === result.evidenceId);
    const freshnessBefore = oefaRecord?.freshnessScore ?? 0;
    const freshnessAfter = update?.freshnessScore ?? freshnessBefore;
    const confidenceBefore = confidenceFromFreshness(freshnessBefore, result.priorStatus);
    const confidenceAfter = update?.confidenceScore ?? confidenceFromFreshness(freshnessAfter, result.resultStatus);

    return {
      readOnly: true,
      evidenceId: result.evidenceId,
      capabilityId: result.capabilityId,
      freshnessBefore,
      freshnessAfter,
      freshnessDelta: freshnessAfter - freshnessBefore,
      confidenceBefore,
      confidenceAfter,
      confidenceDelta: confidenceAfter - confidenceBefore,
      priorStatus: result.priorStatus,
      resultStatus: result.resultStatus,
    };
  });

  const expiredToRefreshed = entries.filter((e) => e.priorStatus === 'EXPIRED' && e.resultStatus === 'REFRESHED').length;
  const staleToFresh = entries.filter(
    (e) => (e.priorStatus === 'STALE' || e.priorStatus === 'EXPIRED') && e.confidenceDelta > 0,
  ).length;
  const confidenceRecovered = entries.reduce((sum, e) => sum + Math.max(0, e.confidenceDelta), 0);

  const overallFreshnessBefore = input.oefa.overallFreshnessScore;
  const avgAfter =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.freshnessAfter, 0) / entries.length
      : overallFreshnessBefore;
  const overallFreshnessAfter = Math.min(
    100,
    Math.round(
      overallFreshnessBefore +
        (avgAfter - entries.reduce((sum, e) => sum + e.freshnessBefore, 0) / Math.max(1, entries.length)) *
          (entries.length / Math.max(1, input.oefa.registry.totalRecords)),
    ),
  );

  return {
    readOnly: true,
    generatedAt: input.generatedAt,
    expiredToRefreshed,
    staleToFresh,
    confidenceRecovered,
    overallFreshnessBefore,
    overallFreshnessAfter,
    freshnessDelta: overallFreshnessAfter - overallFreshnessBefore,
    entries,
  };
}
