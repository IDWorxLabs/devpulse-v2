/**
 * Evidence Revalidation Cycle V1 — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEvidenceRevalidationCycleAssessmentFromDisk,
  runEvidenceRevalidationCycleV1,
  EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN,
} from '../src/evidence-revalidation-cycle-v1/index.js';
import type { EvidenceRevalidationCycleAssessment } from '../src/evidence-revalidation-cycle-v1/evidence-revalidation-cycle-v1-types.js';
import { countDiscoveredByStatus } from '../src/evidence-revalidation-cycle-v1/revalidation-planner.js';

export { EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface EvidenceRevalidationPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_evidence_revalidation_cycle_v1';
  canonicalOwner: 'Evidence Revalidation Cycle Authority V1';
  passToken: string;
  revalidationProofStatus: string;
  freshCount: number;
  agingCount: number;
  staleCount: number;
  expiredCount: number;
  revalidatingCount: number;
  recentlyRefreshedCount: number;
  expiredDiscovered: number;
  expiredRefreshed: number;
  confidenceRecovered: number;
  overallFreshnessBefore: number;
  overallFreshnessAfter: number;
  assessment: EvidenceRevalidationCycleAssessment | null;
}

export function buildEvidenceRevalidationPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): EvidenceRevalidationPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const assessment = input?.refresh
    ? runEvidenceRevalidationCycleV1({ projectRootDir })
    : loadEvidenceRevalidationCycleAssessmentFromDisk(projectRootDir) ??
      runEvidenceRevalidationCycleV1({ projectRootDir });

  const counts = countDiscoveredByStatus(assessment.registry);

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_evidence_revalidation_cycle_v1',
    canonicalOwner: 'Evidence Revalidation Cycle Authority V1',
    passToken: assessment.passToken,
    revalidationProofStatus: assessment.revalidationProofStatus,
    freshCount: counts.fresh,
    agingCount: counts.aging,
    staleCount: counts.stale,
    expiredCount: counts.expired,
    revalidatingCount: counts.revalidating,
    recentlyRefreshedCount: counts.refreshed,
    expiredDiscovered: assessment.expiredDiscovered,
    expiredRefreshed: assessment.expiredRefreshed,
    confidenceRecovered: assessment.confidenceRecovery.confidenceRecovered,
    overallFreshnessBefore: assessment.overallFreshnessBefore,
    overallFreshnessAfter: assessment.overallFreshnessAfter,
    assessment,
  };
}

export function sendEvidenceRevalidationJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildEvidenceRevalidationPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'evidence-revalidation-cycle-v1',
    'X-DevPulse-Canonical-Owner': 'Evidence Revalidation Cycle Authority V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
