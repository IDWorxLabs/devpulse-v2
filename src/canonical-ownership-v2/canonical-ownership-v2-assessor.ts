/**
 * Canonical Ownership V2 Registration — full registration assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_OWNERSHIP_V2_FAIL_TOKEN,
  CANONICAL_OWNERSHIP_V2_PASS_TOKEN,
  REGISTRATION_SCOPE_CAPABILITY_IDS,
} from './canonical-ownership-v2-bounds.js';
import type { CanonicalOwnershipV2Assessment } from './canonical-ownership-v2-types.js';
import { buildDuplicateRiskResolutions, countResolvedDuplicateRisks } from './duplicate-risk-resolution.js';
import { detectOrphanCapabilities, countCriticalOrphans } from './orphan-detector.js';
import { detectOwnershipCollisions } from './ownership-collision-detector.js';
import { buildCanonicalOwnershipGraph } from './ownership-graph-builder.js';
import { CANONICAL_OWNERSHIP_V2_ENTRIES } from './ownership-registry-v2.js';
import { writeCanonicalOwnershipV2Artifacts } from './canonical-ownership-v2-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

function resolveProofStatus(input: {
  registrationScopeComplete: boolean;
  orphanCriticalCount: number;
  collisionCount: number;
  duplicateRisksResolved: number;
}): CanonicalOwnershipV2Assessment['ownershipProofStatus'] {
  const proven =
    input.registrationScopeComplete &&
    input.orphanCriticalCount === 0 &&
    input.collisionCount === 0 &&
    input.duplicateRisksResolved >= 6;
  if (proven) return 'PROVEN';
  if (input.registrationScopeComplete) return 'PARTIAL';
  return 'NOT_PROVEN';
}

function resolvePassToken(
  status: CanonicalOwnershipV2Assessment['ownershipProofStatus'],
): string {
  return status === 'PROVEN'
    ? CANONICAL_OWNERSHIP_V2_PASS_TOKEN
    : CANONICAL_OWNERSHIP_V2_FAIL_TOKEN;
}

export function runCanonicalOwnershipV2Registration(input?: {
  projectRootDir?: string;
}): CanonicalOwnershipV2Assessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const entries = CANONICAL_OWNERSHIP_V2_ENTRIES;
  const registeredIds = new Set(entries.map((e) => e.capabilityId));
  const registrationScopeComplete = REGISTRATION_SCOPE_CAPABILITY_IDS.every((id) =>
    registeredIds.has(id),
  );

  const orphanCapabilities = detectOrphanCapabilities(entries);
  const orphanCriticalCount = countCriticalOrphans(orphanCapabilities);
  const ownershipCollisions = detectOwnershipCollisions(entries);
  const collisionCount = ownershipCollisions.length;
  const duplicateRiskResolutions = buildDuplicateRiskResolutions();
  const duplicateRisksResolved = countResolvedDuplicateRisks();
  const graph = buildCanonicalOwnershipGraph(entries);

  const ownershipProofStatus = resolveProofStatus({
    registrationScopeComplete,
    orphanCriticalCount,
    collisionCount,
    duplicateRisksResolved,
  });

  const canonicalOwnershipGapClosed = ownershipProofStatus === 'PROVEN';

  const assessment: CanonicalOwnershipV2Assessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Canonical Ownership V2 Registration',
    passToken: resolvePassToken(ownershipProofStatus),
    version: 'V2',
    generatedAt: new Date().toISOString(),
    registeredCapabilities: entries.length,
    registrationScopeComplete,
    orphanCriticalCount,
    collisionCount,
    duplicateRisksResolved,
    ownershipProofStatus,
    entries,
    graph,
    orphanCapabilities,
    ownershipCollisions,
    duplicateRiskResolutions,
    auditImpact: {
      readOnly: true,
      generatedAt: new Date().toISOString(),
      canonicalOwnershipGapClosed,
      duplicateRiskFalsePositivesReduced: duplicateRisksResolved,
      orphanCriticalCapabilities: orphanCriticalCount,
      ownershipCollisions: collisionCount,
      auditShouldReport: canonicalOwnershipGapClosed
        ? 'Canonical Ownership V2 Registration — COMPLETE'
        : 'Canonical Ownership V2 Registration — highest priority gap',
    },
  };

  writeCanonicalOwnershipV2Artifacts(projectRootDir, assessment);
  return assessment;
}
