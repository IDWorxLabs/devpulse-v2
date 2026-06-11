/**
 * Unknown Discovery Authority — public API.
 */

export {
  UNKNOWN_DISCOVERY_AUTHORITY_PASS_TOKEN,
  UNKNOWN_DISCOVERY_OWNER_MODULE,
  MAX_DISCOVERY_CATEGORIES,
  MAX_UNKNOWN_FINDINGS,
  MAX_RECOMMENDED_TESTS,
  MAX_UNKNOWN_RECOMMENDATIONS,
  MAX_UNKNOWN_HISTORY,
  UNKNOWN_DISCOVERY_CACHE_KEY_PREFIX,
  UNKNOWN_DISCOVERY_REPORT_TITLE,
  UNKNOWN_DISCOVERY_BLOCK_SCORE,
  UNKNOWN_HIGH_COUNT_BLOCK_THRESHOLD,
} from './unknown-discovery-bounds.js';

export type {
  UnknownDiscoveryCategory,
  UnknownDiscoverySeverity,
  UnknownDiscoveryReadinessState,
  UnknownDiscoveryCategoryDefinition,
  UnknownDiscoveryFinding,
  UnknownDiscoveryAssessment,
} from './unknown-discovery-types.js';

export { UNKNOWN_DISCOVERY_CATEGORIES, BOUNDED_UNCOVERED_AREAS } from './unknown-discovery-scenarios.js';

export {
  resetUnknownDiscoveryHistoryForTests,
  recordUnknownDiscoveryAssessment,
  getUnknownDiscoveryHistorySize,
  getLatestUnknownDiscoveryAssessment,
} from './unknown-discovery-history.js';

export { buildUnknownDiscoveryReportMarkdown } from './unknown-discovery-report-builder.js';

export {
  validateUnknownDiscoveryCategoryCount,
  validateBlindSpotDetection,
  validateContradictionDetection,
  validateCoverageGapDetection,
  validateUnknownDiscoveryClassification,
  validateRecommendedTestGeneration,
  validateUnknownDiscoveryLaunchBlocking,
  validateUnknownDiscoveryDeterministicScoring,
  validateUnknownDiscoveryRecommendationGeneration,
} from './unknown-discovery-validator.js';

export {
  assessUnknownDiscoveryAuthority,
  buildUnknownDiscoveryAuthorityArtifacts,
} from './unknown-discovery-authority.js';
