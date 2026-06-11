/**
 * UI Reviewer Authority — public API.
 */

export {
  UI_REVIEWER_AUTHORITY_PASS_TOKEN,
  UI_REVIEWER_OWNER_MODULE,
  MAX_UI_REVIEWER_HISTORY,
  UI_REVIEWER_CACHE_KEY_PREFIX,
  UI_REVIEWER_REPORT_TITLE,
  UI_REVIEW_BLOCK_SCORE,
  UI_NAVIGATION_BLOCK_SCORE,
  UI_DISCOVERABILITY_BLOCK_SCORE,
} from './ui-reviewer-bounds.js';

export type {
  UIReviewerCategory,
  UIReviewerReadinessState,
  UIReviewerScenarioDefinition,
  UIReviewerScenarioResult,
  UIReviewerAssessment,
} from './ui-reviewer-types.js';

export {
  UI_REVIEWER_SCENARIOS,
  MAX_UI_REVIEWER_CATEGORIES,
  LAUNCH_ESSENTIAL_SCREEN_EVIDENCE,
  DISCOVERABILITY_CAPABILITIES,
} from './ui-reviewer-scenarios.js';

export {
  resetUIReviewerHistoryForTests,
  recordUIReviewerAssessment,
  getUIReviewerHistorySize,
  getLatestUIReviewerAssessment,
} from './ui-reviewer-history.js';

export { buildUIReviewerReportMarkdown } from './ui-reviewer-report-builder.js';

export {
  validateUIReviewerCategoryCount,
  validateUIReviewerScoreCalculation,
  validateNavigationReview,
  validateDiscoverabilityReview,
  validateHierarchyReview,
  validateWorkflowReview,
  validateMissingScreenDetection,
  validateUIReviewerLaunchBlocking,
  validateUIReviewerDeterministicScoring,
  validateUIReviewerAdvisoryOnly,
  validateUIReviewerReportGeneration,
} from './ui-reviewer-validator.js';

export { assessUIReviewerAuthority, buildUIReviewerAuthorityArtifacts } from './ui-reviewer-authority.js';
