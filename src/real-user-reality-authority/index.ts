/**
 * Real User Reality Authority — public API.
 */

export {
  REAL_USER_REALITY_AUTHORITY_PASS_TOKEN,
  REAL_USER_REALITY_OWNER_MODULE,
  MAX_REAL_USER_FINDINGS,
  MAX_REAL_USER_RECOMMENDATIONS,
  MAX_REAL_USER_HISTORY,
  REAL_USER_REALITY_CACHE_KEY_PREFIX,
  REAL_USER_REALITY_REPORT_TITLE,
  REAL_USER_SUCCESS_BLOCK_SCORE,
  REAL_USER_CONFUSION_BLOCK_SCORE,
} from './real-user-reality-bounds.js';

export type {
  RealUserEvidenceType,
  RealUserRealityCategory,
  RealUserRealityReadinessState,
  RealUserRealityScenarioDefinition,
  RealUserEvidenceItem,
  RealUserRealityAssessment,
} from './real-user-reality-types.js';

export { REAL_USER_REALITY_SCENARIOS, MAX_REAL_USER_CATEGORIES } from './real-user-reality-scenarios.js';

export {
  resetRealUserRealityHistoryForTests,
  recordRealUserRealityAssessment,
  getRealUserRealityHistorySize,
  getLatestRealUserRealityAssessment,
} from './real-user-reality-history.js';

export { buildRealUserRealityReportMarkdown } from './real-user-reality-report-builder.js';

export {
  validateRealUserCategoryCount,
  validateEvidenceClassification,
  validateNoRealUserDetection,
  validateRetentionScoring,
  validateConfusionScoring,
  validateRealUserLaunchBlocking,
  validateRealUserDeterministicScoring,
  validateRealUserRecommendationGeneration,
  validateRealUserAdvisoryOnly,
  validateFounderEvidenceSeparation,
} from './real-user-reality-validator.js';

export {
  assessRealUserRealityAuthority,
  buildRealUserRealityAuthorityArtifacts,
} from './real-user-reality-authority.js';
