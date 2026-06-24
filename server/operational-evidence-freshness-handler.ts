/**
 * Operational Evidence Freshness Authority V1 — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadOperationalEvidenceFreshnessAssessmentFromDisk,
  runOperationalEvidenceFreshnessAuthorityV1,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN,
} from '../src/operational-evidence-freshness-authority-v1/index.js';
import type { OperationalEvidenceFreshnessAssessment } from '../src/operational-evidence-freshness-authority-v1/operational-evidence-freshness-v1-types.js';

export { OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface OperationalEvidenceFreshnessPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_operational_evidence_freshness_authority_v1';
  canonicalOwner: 'Operational Evidence Freshness Authority V1';
  passToken: string;
  overallFreshnessScore: number;
  freshCapabilities: number;
  agingCapabilities: number;
  staleCapabilities: number;
  expiredCapabilities: number;
  evidenceSourcesConsumed: number;
  freshnessProofStatus: string;
  confidenceDecaySummary: string;
  assessment: OperationalEvidenceFreshnessAssessment | null;
}

export function buildOperationalEvidenceFreshnessPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): OperationalEvidenceFreshnessPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const assessment = input?.refresh
    ? runOperationalEvidenceFreshnessAuthorityV1({ projectRootDir })
    : loadOperationalEvidenceFreshnessAssessmentFromDisk(projectRootDir) ??
      runOperationalEvidenceFreshnessAuthorityV1({ projectRootDir });

  const decay = assessment.confidenceDecay.decayByStatus;

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_operational_evidence_freshness_authority_v1',
    canonicalOwner: 'Operational Evidence Freshness Authority V1',
    passToken: assessment.passToken,
    overallFreshnessScore: assessment.overallFreshnessScore,
    freshCapabilities: assessment.registry.freshCount,
    agingCapabilities: assessment.registry.agingCount,
    staleCapabilities: assessment.registry.staleCount,
    expiredCapabilities: assessment.registry.expiredCount,
    evidenceSourcesConsumed: assessment.evidenceSourcesConsumed,
    freshnessProofStatus: assessment.freshnessProofStatus,
    confidenceDecaySummary: `FRESH ${decay.FRESH}% · AGING ${decay.AGING}% · STALE ${decay.STALE}% · EXPIRED ${decay.EXPIRED}%`,
    assessment,
  };
}

export function sendOperationalEvidenceFreshnessJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildOperationalEvidenceFreshnessPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'operational-evidence-freshness-authority-v1',
    'X-DevPulse-Canonical-Owner': 'Operational Evidence Freshness Authority V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
