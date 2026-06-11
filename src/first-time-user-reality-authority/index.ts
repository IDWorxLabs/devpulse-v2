/**
 * First-Time User Reality Authority — public API.
 */

export {
  FIRST_TIME_USER_REALITY_AUTHORITY_PASS_TOKEN,
  FIRST_TIME_USER_REALITY_OWNER_MODULE,
  MAX_FIRST_TIME_USER_CATEGORIES,
  MAX_FIRST_TIME_USER_SCENARIOS,
  MAX_FIRST_TIME_USER_FINDINGS,
  MAX_FIRST_TIME_USER_CONFUSION_POINTS,
  MAX_FIRST_TIME_USER_BLOCKERS,
  MAX_FIRST_TIME_USER_RECOMMENDATIONS,
  MAX_FIRST_TIME_USER_HISTORY,
  FIRST_TIME_USER_REALITY_CACHE_KEY_PREFIX,
  FIRST_TIME_USER_REALITY_REPORT_TITLE,
  FIRST_TIME_USER_BLOCK_SCORE,
  FIRST_TIME_USER_CONFUSION_BLOCK_SCORE,
  FIRST_TIME_USER_PASS_THRESHOLD,
  FIRST_TIME_USER_CRITICAL_SCORE,
} from './first-time-user-reality-bounds.js';

export type {
  FirstTimeUserScenarioCategory,
  FirstTimeUserReadinessState,
  FirstTimeUserScenarioDefinition,
  FirstTimeUserScenarioResult,
  FirstTimeUserRealityAssessment,
} from './first-time-user-reality-types.js';

export { FIRST_TIME_USER_REALITY_SCENARIOS } from './first-time-user-reality-scenarios.js';

export {
  resetFirstTimeUserRealityHistoryForTests,
  recordFirstTimeUserRealityAssessment,
  getFirstTimeUserRealityHistorySize,
  getLatestFirstTimeUserRealityAssessment,
} from './first-time-user-reality-history.js';

export { buildFirstTimeUserRealityReportMarkdown } from './first-time-user-reality-report-builder.js';

export {
  validateFirstTimeUserCategoryCount,
  validateConfusionDetection,
  validateOnboardingEvaluation,
  validateWorkflowEvaluation,
  validateFirstTimeUserLaunchBlocking,
  validateFirstTimeUserDeterministicScoring,
  validateFirstTimeUserRecommendationGeneration,
  validateFirstTimeUserScenarioClassification,
  validateFirstTimeUserAdvisoryOnly,
} from './first-time-user-reality-validator.js';

export {
  assessFirstTimeUserRealityAuthority,
  buildFirstTimeUserRealityAuthorityArtifacts,
} from './first-time-user-reality-authority.js';
