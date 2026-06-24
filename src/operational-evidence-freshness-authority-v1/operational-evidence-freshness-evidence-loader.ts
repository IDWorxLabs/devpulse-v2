/**
 * Operational Evidence Freshness Authority V1 — evidence snapshot (read-only).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_ARTIFACT_DIR,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN,
} from './operational-evidence-freshness-v1-bounds.js';
import type { OperationalEvidenceFreshnessAssessment } from './operational-evidence-freshness-v1-types.js';

export function isOperationalEvidenceFreshnessProven(projectRootDir: string): boolean {
  const path = join(
    projectRootDir,
    OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as OperationalEvidenceFreshnessAssessment;
    return data.passToken === OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadOperationalEvidenceFreshnessAssessmentFromDisk(
  projectRootDir: string,
): OperationalEvidenceFreshnessAssessment | null {
  const path = join(
    projectRootDir,
    OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as OperationalEvidenceFreshnessAssessment;
  } catch {
    return null;
  }
}

export function loadFreshnessSummaryForAudit(projectRootDir: string): {
  freshCount: number;
  agingCount: number;
  staleCount: number;
  expiredCount: number;
  overallFreshnessScore: number;
  proven: boolean;
} {
  const assessment = loadOperationalEvidenceFreshnessAssessmentFromDisk(projectRootDir);
  if (!assessment) {
    return {
      freshCount: 0,
      agingCount: 0,
      staleCount: 0,
      expiredCount: 0,
      overallFreshnessScore: 0,
      proven: false,
    };
  }
  return {
    freshCount: assessment.registry.freshCount,
    agingCount: assessment.registry.agingCount,
    staleCount: assessment.registry.staleCount,
    expiredCount: assessment.registry.expiredCount,
    overallFreshnessScore: assessment.overallFreshnessScore,
    proven: assessment.passToken === OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN,
  };
}
