/**
 * First-Time User Reality Engine — public API.
 */

export {
  FIRST_TIME_USER_REALITY_PASS_TOKEN,
  FIRST_TIME_USER_REALITY_OWNER_MODULE,
  MAX_FIRST_TIME_SCENARIOS,
  MAX_FIRST_TIME_FINDINGS,
  MAX_ACTION_PATH_STEPS,
  FIRST_TIME_USER_ACTION_PATH_PASS_TOKEN,
  MAX_SCREEN_PURPOSE_CHECKS,
} from './first-time-user-reality-bounds.js';

export type {
  FirstTimeFindingType,
  FirstTimeRealityCategory,
  FirstTimeSeverity,
  FirstTimeUserFinding,
  FirstTimeScreenPurposeResult,
  FirstTimeScenarioResult,
  FirstTimeFeedEvent,
  FirstTimeUserCategoryScores,
  FirstTimeUserRealityAssessment,
  FirstTimeUserShellSources,
  AssessFirstTimeUserRealityInput,
  EnrichedFirstTimeAssessments,
} from './first-time-user-reality-types.js';

export {
  assessFirstTimeUserReality,
  enrichAssessmentsWithFirstTimeUserReality,
  firstTimeActionPathResolved,
  navPurposeSeparationResolved,
  resetFirstTimeUserCounterForTests,
} from './first-time-user-reality-authority.js';
