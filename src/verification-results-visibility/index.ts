/**
 * Verification Results Visibility — public exports.
 */

export {
  VERIFICATION_RESULTS_VISIBILITY_PASS_TOKEN,
  VERIFICATION_RESULTS_VISIBILITY_OWNER_MODULE,
} from './verification-results-visibility-types.js';

export type {
  FixPriority,
  VerificationCategory,
  VerificationCategoryGroup,
  VerificationCheckResult,
  VerificationCheckStatus,
  VerificationFeedEvent,
  VerificationFixItem,
  VerificationResultsState,
  VerificationResultsSummary,
  VerificationResultsVisibilityAssessment,
} from './verification-results-visibility-types.js';

export {
  assessVerificationResultsVisibility,
  buildVerificationResultsFromV4Report,
  buildVerificationResultsFromWorkspace,
  buildVerificationResultsRunning,
} from './verification-results-visibility-authority.js';

export {
  getCachedVerificationResults,
  resetVerificationResultsCacheForTests,
  setLastVerificationResultsFromV4Report,
} from './verification-results-cache.js';
