/**
 * Canonical Capability Ownership V1 — public API.
 */

export {
  CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN,
  CONSOLIDATION_REPORT_TITLE,
  CANONICAL_OWNERSHIP_ENTRIES,
  FUTURE_CONSOLIDATION_RECOMMENDATIONS,
  listCanonicalOwnershipEntries,
  getCanonicalOwnershipEntry,
  listEntriesByStatus,
  resolveAuthoritativeOwner,
  assertSingleCanonicalOwner,
} from './ownership-registry.js';

export {
  CONSOLIDATION_GROUPS,
  listConsolidationGroups,
  getConsolidationGroup,
} from './consolidation-groups.js';

export {
  validateCanonicalCapabilityOwnership,
  countRemainingDuplicateRisk,
  listMergedCapabilities,
  listRemovedCapabilities,
  listCanonicalOwnerEntries,
} from './ownership-validator.js';

export type { CanonicalOwnershipValidation } from './ownership-validator.js';

export {
  buildCanonicalOwnershipAssessment,
  isCanonicalOwnershipConsolidationComplete,
} from './consolidation-assessment.js';

export { buildConsolidationReportMarkdown } from './consolidation-report-builder.js';

export {
  NAVIGATION_REVIEW_REMOVED,
  NAVIGATION_REVIEW_AUTHORITATIVE_OWNERS,
  FORBIDDEN_NAVIGATION_REVIEW_PATHS,
  assertNavigationReviewNotStandalone,
  isNavigationReviewCapabilityRemoved,
} from './navigation-review-removal-guard.js';

export type {
  CanonicalOwnershipStatus,
  ConsolidationGroupId,
  CanonicalCapabilityOwnershipEntry,
  ConsolidationGroup,
  CanonicalOwnershipAssessment,
} from './canonical-capability-ownership-types.js';
