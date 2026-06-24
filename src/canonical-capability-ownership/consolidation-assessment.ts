/**
 * Canonical Capability Ownership V1 — assessment builder.
 */

import type { CanonicalOwnershipAssessment } from './canonical-capability-ownership-types.js';
import { CONSOLIDATION_GROUPS } from './consolidation-groups.js';
import {
  CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN,
  CANONICAL_OWNERSHIP_ENTRIES,
  FUTURE_CONSOLIDATION_RECOMMENDATIONS,
} from './ownership-registry.js';
import {
  countRemainingDuplicateRisk,
  listCanonicalOwnerEntries,
  listMergedCapabilities,
  listRemovedCapabilities,
  validateCanonicalCapabilityOwnership,
} from './ownership-validator.js';

export function buildCanonicalOwnershipAssessment(root: string): CanonicalOwnershipAssessment {
  const validation = validateCanonicalCapabilityOwnership(root);

  return {
    version: 'V1',
    generatedAt: new Date().toISOString(),
    passToken: CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN,
    consolidationGroupsComplete: validation.valid ? CONSOLIDATION_GROUPS.length : 0,
    consolidationGroupsTotal: CONSOLIDATION_GROUPS.length,
    mergedCapabilities: listMergedCapabilities(),
    removedCapabilities: listRemovedCapabilities(),
    canonicalOwners: listCanonicalOwnerEntries(),
    remainingDuplicateRiskCount: countRemainingDuplicateRisk(),
    futureConsolidationRecommendations: FUTURE_CONSOLIDATION_RECOMMENDATIONS,
    entries: CANONICAL_OWNERSHIP_ENTRIES,
  };
}

export function isCanonicalOwnershipConsolidationComplete(root: string): boolean {
  return validateCanonicalCapabilityOwnership(root).valid;
}
