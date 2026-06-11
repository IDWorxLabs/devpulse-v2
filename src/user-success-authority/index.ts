/**
 * User Success Authority — public API.
 */

export {
  USER_SUCCESS_AUTHORITY_PASS_TOKEN,
  USER_SUCCESS_OWNER_MODULE,
  MAX_USER_SUCCESS_SCENARIOS,
  MAX_USER_SUCCESS_BLOCKERS,
  MAX_USER_SUCCESS_RECOMMENDATIONS,
  MAX_USER_SUCCESS_FINDINGS,
  MAX_USER_SUCCESS_HISTORY,
  USER_SUCCESS_CACHE_KEY_PREFIX,
  USER_SUCCESS_REPORT_TITLE,
  USER_SUCCESS_BLOCK_SCORE,
  USER_SUCCESS_OUTCOME_BLOCK_SCORE,
} from './user-success-bounds.js';

export type {
  UserSuccessGoalCategory,
  UserSuccessReadinessState,
  UserSuccessScenarioDefinition,
  UserSuccessScenarioResult,
  UserSuccessAssessment,
} from './user-success-types.js';

export { USER_SUCCESS_SCENARIOS } from './user-success-scenarios.js';

export {
  resetUserSuccessHistoryForTests,
  recordUserSuccessAssessment,
  getUserSuccessHistorySize,
  getLatestUserSuccessAssessment,
} from './user-success-history.js';

export { buildUserSuccessReportMarkdown } from './user-success-report-builder.js';

export {
  validateUserSuccessScenarioCount,
  validateUserSuccessDeterministicScoring,
  validateUserSuccessLaunchBlocking,
  validateCriticalSuccessFailureDetection,
  validateUserBlockerDetection,
  validateOutcomeAchievementScoring,
} from './user-success-validator.js';

export { assessUserSuccessAuthority, buildUserSuccessAuthorityArtifacts } from './user-success-authority.js';
