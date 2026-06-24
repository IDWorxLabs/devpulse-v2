/**
 * Evidence Revalidation Cycle V1 — main authority assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isOperationalEvidenceFreshnessProven,
  loadOperationalEvidenceFreshnessAssessmentFromDisk,
  runOperationalEvidenceFreshnessAuthorityV1,
} from '../operational-evidence-freshness-authority-v1/index.js';
import {
  EVIDENCE_REVALIDATION_CYCLE_V1_FAIL_TOKEN,
  EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN,
  MIN_CONFIDENCE_RECOVERY_POINTS,
  MIN_EXPIRED_REFRESHED,
  MIN_REVALIDATION_RECORDS,
} from './evidence-revalidation-cycle-v1-bounds.js';
import type { EvidenceRevalidationCycleAssessment } from './evidence-revalidation-cycle-v1-types.js';
import { buildConfidenceRecoveryAssessment } from './confidence-recovery-assessment.js';
import { runEvidenceRevalidation } from './evidence-revalidation-runner.js';
import {
  buildPrioritizedRevalidationQueue,
  buildRevalidationRegistry,
  countDiscoveredByStatus,
} from './revalidation-planner.js';
import { writeEvidenceRevalidationCycleArtifacts } from './evidence-revalidation-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

function resolveProofStatus(input: {
  oefaConsumed: boolean;
  governancePlannerUsed: boolean;
  expiredDiscovered: number;
  expiredRefreshed: number;
  revalidationSucceeded: number;
  revalidationFailed: number;
  confidenceRecoveryPoints: number;
  registrySize: number;
}): EvidenceRevalidationCycleAssessment['revalidationProofStatus'] {
  const proven =
    input.oefaConsumed &&
    input.governancePlannerUsed &&
    input.registrySize >= MIN_REVALIDATION_RECORDS &&
    input.expiredDiscovered >= MIN_EXPIRED_REFRESHED &&
    input.expiredRefreshed >= MIN_EXPIRED_REFRESHED &&
    input.revalidationSucceeded >= MIN_EXPIRED_REFRESHED &&
    input.revalidationFailed === 0 &&
    input.confidenceRecoveryPoints >= MIN_CONFIDENCE_RECOVERY_POINTS;

  if (proven) return 'PROVEN';
  if (input.registrySize > 0) return 'PARTIAL';
  return 'NOT_PROVEN';
}

export function runEvidenceRevalidationCycleV1(input?: {
  projectRootDir?: string;
  ensureOefa?: boolean;
}): EvidenceRevalidationCycleAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const generatedAt = new Date().toISOString();

  if (input?.ensureOefa !== false && !isOperationalEvidenceFreshnessProven(projectRootDir)) {
    runOperationalEvidenceFreshnessAuthorityV1({ projectRootDir });
  }

  const oefa =
    loadOperationalEvidenceFreshnessAssessmentFromDisk(projectRootDir) ??
    runOperationalEvidenceFreshnessAuthorityV1({ projectRootDir });

  const oefaConsumed = isOperationalEvidenceFreshnessProven(projectRootDir);
  const initialRegistry = buildRevalidationRegistry(oefa);
  const discovered = countDiscoveredByStatus(initialRegistry);
  const queue = buildPrioritizedRevalidationQueue({
    projectRootDir,
    registry: initialRegistry,
    oefa,
  });

  const governancePlannerUsed = queue.every((q) => q.governancePlannerUsed);

  const runOutput = runEvidenceRevalidation({
    registry: initialRegistry,
    queue,
    oefa,
  });

  const confidenceRecovery = buildConfidenceRecoveryAssessment({
    oefa,
    results: runOutput.results,
    freshnessUpdates: runOutput.freshnessUpdates,
    generatedAt,
  });

  const finalRegistry = runOutput.updatedRegistry;
  const finalDiscovered = countDiscoveredByStatus(finalRegistry);
  const expiredRefreshed = runOutput.results.filter(
    (r) => r.priorStatus === 'EXPIRED' && r.proofRefreshed,
  ).length;
  const revalidationSucceeded = runOutput.results.filter((r) => r.proofRefreshed).length;
  const revalidationFailed = runOutput.failures.length;

  const revalidationProofStatus = resolveProofStatus({
    oefaConsumed,
    governancePlannerUsed,
    expiredDiscovered: discovered.expired,
    expiredRefreshed,
    revalidationSucceeded,
    revalidationFailed,
    confidenceRecoveryPoints: confidenceRecovery.confidenceRecovered,
    registrySize: finalRegistry.length,
  });

  const passToken =
    revalidationProofStatus === 'PROVEN'
      ? EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN
      : EVIDENCE_REVALIDATION_CYCLE_V1_FAIL_TOKEN;

  const expiredEvidenceGapClosed = discovered.expired > 0 && finalDiscovered.expired === 0;

  const assessment: EvidenceRevalidationCycleAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Evidence Revalidation Cycle Authority V1',
    passToken,
    version: 'V1',
    generatedAt,
    oefaConsumed,
    governancePlannerUsed,
    expiredDiscovered: discovered.expired,
    agingDiscovered: discovered.aging,
    staleDiscovered: discovered.stale,
    revalidationScheduled: queue.length,
    revalidationSucceeded,
    revalidationFailed,
    expiredRefreshed,
    confidenceRecoveryPoints: confidenceRecovery.confidenceRecovered,
    overallFreshnessBefore: confidenceRecovery.overallFreshnessBefore,
    overallFreshnessAfter: confidenceRecovery.overallFreshnessAfter,
    revalidationProofStatus,
    registry: finalRegistry,
    queue,
    results: runOutput.results,
    confidenceRecovery,
    freshnessUpdates: runOutput.freshnessUpdates,
    failures: runOutput.failures,
    auditImpact: {
      readOnly: true,
      generatedAt,
      expiredEvidenceGapClosed,
      strategicRoadmapUpdated: expiredEvidenceGapClosed,
      capabilityAuditExtended: true,
      auditShouldReport: expiredEvidenceGapClosed
        ? 'All expired evidence refreshed — strategic priority shifts to Operational Excellence Maintenance'
        : `${finalDiscovered.expired} expired evidence record(s) remain — revalidation cycle incomplete`,
    },
  };

  writeEvidenceRevalidationCycleArtifacts(projectRootDir, assessment);
  return assessment;
}
