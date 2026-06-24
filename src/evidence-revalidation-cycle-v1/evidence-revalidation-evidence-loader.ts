/**
 * Evidence Revalidation Cycle V1 — evidence loader (read-only).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  EVIDENCE_REVALIDATION_CYCLE_V1_ARTIFACT_DIR,
  EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN,
} from './evidence-revalidation-cycle-v1-bounds.js';
import type { EvidenceRevalidationCycleAssessment } from './evidence-revalidation-cycle-v1-types.js';
import { countDiscoveredByStatus } from './revalidation-planner.js';

export function isEvidenceRevalidationCycleProven(projectRootDir: string): boolean {
  const path = join(projectRootDir, EVIDENCE_REVALIDATION_CYCLE_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as EvidenceRevalidationCycleAssessment;
    return data.passToken === EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadEvidenceRevalidationCycleAssessmentFromDisk(
  projectRootDir: string,
): EvidenceRevalidationCycleAssessment | null {
  const path = join(projectRootDir, EVIDENCE_REVALIDATION_CYCLE_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as EvidenceRevalidationCycleAssessment;
  } catch {
    return null;
  }
}

export function loadRevalidationSummaryForAudit(projectRootDir: string): {
  freshCount: number;
  agingCount: number;
  staleCount: number;
  expiredCount: number;
  revalidatingCount: number;
  refreshedCount: number;
  revalidatedEvidenceCount: number;
  confidenceRecovered: number;
  overallFreshnessScore: number;
  proven: boolean;
  expiredEvidenceGapClosed: boolean;
} {
  const assessment = loadEvidenceRevalidationCycleAssessmentFromDisk(projectRootDir);
  if (!assessment) {
    return {
      freshCount: 0,
      agingCount: 0,
      staleCount: 0,
      expiredCount: 0,
      revalidatingCount: 0,
      refreshedCount: 0,
      revalidatedEvidenceCount: 0,
      confidenceRecovered: 0,
      overallFreshnessScore: 0,
      proven: false,
      expiredEvidenceGapClosed: false,
    };
  }

  const counts = countDiscoveredByStatus(assessment.registry);

  return {
    freshCount: counts.fresh,
    agingCount: counts.aging,
    staleCount: counts.stale,
    expiredCount: counts.expired,
    revalidatingCount: counts.revalidating,
    refreshedCount: counts.refreshed,
    revalidatedEvidenceCount: assessment.revalidationSucceeded,
    confidenceRecovered: assessment.confidenceRecovery.confidenceRecovered,
    overallFreshnessScore: assessment.overallFreshnessAfter,
    proven: assessment.passToken === EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN,
    expiredEvidenceGapClosed: assessment.auditImpact.expiredEvidenceGapClosed,
  };
}

export function loadEffectiveExpiredCountForStrategicAudit(projectRootDir: string): {
  rawExpiredCount: number;
  effectiveExpiredCount: number;
  revalidationProven: boolean;
} {
  const revalidation = loadEvidenceRevalidationCycleAssessmentFromDisk(projectRootDir);
  const proven = revalidation?.passToken === EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN;
  const rawExpired = revalidation?.expiredDiscovered ?? 0;
  const effectiveExpired = proven && revalidation?.auditImpact.expiredEvidenceGapClosed ? 0 : (revalidation?.registry.filter((r) => r.currentStatus === 'EXPIRED').length ?? rawExpired);

  return {
    rawExpiredCount: rawExpired,
    effectiveExpiredCount: effectiveExpired,
    revalidationProven: proven,
  };
}
