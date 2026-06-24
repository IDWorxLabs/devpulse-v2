/**
 * Canonical Ownership V2 Registration — public API.
 */

export {
  CANONICAL_OWNERSHIP_V2_PASS_TOKEN,
  CANONICAL_OWNERSHIP_V2_FAIL_TOKEN,
  CANONICAL_OWNERSHIP_V2_ARTIFACT_DIR,
  CANONICAL_OWNERSHIP_V2_REGISTRATION_REPORT_TITLE,
  REGISTRATION_SCOPE_CAPABILITY_IDS,
  PRIOR_PASS_TOKENS,
} from './canonical-ownership-v2-bounds.js';

export type {
  CanonicalOwnerId,
  CanonicalOwnershipEntry,
  CanonicalOwnershipGraph,
  CanonicalOwnershipGraphNode,
  OrphanCapabilityRecord,
  OwnershipCollisionRecord,
  DuplicateRiskResolution,
  OwnershipAuditImpact,
  CanonicalOwnershipV2Assessment,
} from './canonical-ownership-v2-types.js';

export {
  CANONICAL_OWNERSHIP_V2_ENTRIES,
  getCanonicalOwnershipV2Entry,
  listCanonicalOwnershipV2Entries,
} from './ownership-registry-v2.js';

export { DUPLICATE_RISK_RESOLUTIONS, buildDuplicateRiskResolutions } from './duplicate-risk-resolution.js';
export { buildCanonicalOwnershipGraph } from './ownership-graph-builder.js';
export { detectOrphanCapabilities, countCriticalOrphans } from './orphan-detector.js';
export { detectOwnershipCollisions } from './ownership-collision-detector.js';
export { runCanonicalOwnershipV2Registration } from './canonical-ownership-v2-assessor.js';
export { writeCanonicalOwnershipV2Artifacts } from './canonical-ownership-v2-artifact-writer.js';
export {
  isCanonicalOwnershipV2Proven,
  loadCanonicalOwnershipV2AssessmentFromDisk,
} from './canonical-ownership-v2-evidence-loader.js';
export { buildCanonicalOwnershipV2ReportMarkdown } from './canonical-ownership-v2-report-builder.js';
