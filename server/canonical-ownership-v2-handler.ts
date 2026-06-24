/**
 * Canonical Ownership V2 Registration — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadCanonicalOwnershipV2AssessmentFromDisk,
  runCanonicalOwnershipV2Registration,
  CANONICAL_OWNERSHIP_V2_PASS_TOKEN,
} from '../src/canonical-ownership-v2/index.js';
import type { CanonicalOwnershipV2Assessment } from '../src/canonical-ownership-v2/canonical-ownership-v2-types.js';

export { CANONICAL_OWNERSHIP_V2_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface CanonicalOwnershipV2Payload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_canonical_ownership_v2';
  canonicalOwner: 'Canonical Ownership V2 Registration';
  passToken: string;
  registeredCapabilities: number;
  registrationScopeComplete: boolean;
  orphanCriticalCount: number;
  collisionCount: number;
  duplicateRisksResolved: number;
  ownershipProofStatus: string;
  canonicalOwners: readonly string[];
  orphanCapabilities: number;
  duplicateRisks: number;
  resolvedOverlaps: number;
  assessment: CanonicalOwnershipV2Assessment | null;
}

export function buildCanonicalOwnershipV2Payload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): CanonicalOwnershipV2Payload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const assessment = input?.refresh
    ? runCanonicalOwnershipV2Registration({ projectRootDir })
    : loadCanonicalOwnershipV2AssessmentFromDisk(projectRootDir) ??
      runCanonicalOwnershipV2Registration({ projectRootDir });

  const canonicalOwners = assessment.graph.nodes.map((n) => n.owner);
  const duplicateRisks = assessment.duplicateRiskResolutions.filter((r) => !r.resolved).length;

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_canonical_ownership_v2',
    canonicalOwner: 'Canonical Ownership V2 Registration',
    passToken: assessment.passToken,
    registeredCapabilities: assessment.registeredCapabilities,
    registrationScopeComplete: assessment.registrationScopeComplete,
    orphanCriticalCount: assessment.orphanCriticalCount,
    collisionCount: assessment.collisionCount,
    duplicateRisksResolved: assessment.duplicateRisksResolved,
    ownershipProofStatus: assessment.ownershipProofStatus,
    canonicalOwners,
    orphanCapabilities: assessment.orphanCapabilities.length,
    duplicateRisks,
    resolvedOverlaps: assessment.duplicateRisksResolved,
    assessment,
  };
}

export function sendCanonicalOwnershipV2Json(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildCanonicalOwnershipV2Payload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'canonical-ownership-v2',
    'X-DevPulse-Canonical-Owner': 'Canonical Ownership V2 Registration',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
