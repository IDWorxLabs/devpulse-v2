/**
 * Gap Detection Authority — public API.
 */

export {
  GAP_DETECTION_AUTHORITY_PASS_TOKEN,
  GAP_DETECTION_OWNER_MODULE,
  MAX_GAP_CATEGORIES,
  MAX_DETECTED_GAPS,
  MAX_GAP_RECOMMENDATIONS,
  MAX_GAP_HISTORY,
  GAP_DETECTION_CACHE_KEY_PREFIX,
  GAP_DETECTION_REPORT_TITLE,
  GAP_DETECTION_BLOCK_SCORE,
  GAP_HIGH_COUNT_BLOCK_THRESHOLD,
} from './gap-detection-bounds.js';

export type {
  GapSeverity,
  GapImpact,
  GapCategory,
  GapDetectionReadinessState,
  GapCategoryDefinition,
  GapDetectionFinding,
  GapDetectionAssessment,
} from './gap-detection-types.js';

export { GAP_DETECTION_CATEGORIES } from './gap-detection-scenarios.js';

export {
  resetGapDetectionHistoryForTests,
  recordGapDetectionAssessment,
  getGapDetectionHistorySize,
  getLatestGapDetectionAssessment,
} from './gap-detection-history.js';

export { buildGapDetectionReportMarkdown } from './gap-detection-report-builder.js';

export {
  validateGapCategoryCount,
  validateGapClassification,
  validateGapSeverityClassification,
  validateGapImpactMapping,
  validateGapLaunchBlocking,
  validateGapDeterministicScoring,
  validateGapRecommendationGeneration,
} from './gap-detection-validator.js';

export { assessGapDetectionAuthority, buildGapDetectionAuthorityArtifacts } from './gap-detection-authority.js';
