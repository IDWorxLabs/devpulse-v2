/**
 * Founder Sensemaking Engine — public API.
 */

export {
  FOUNDER_SENSEMAKING_ENGINE_PASS_TOKEN,
  FOUNDER_SENSEMAKING_ENGINE_OWNER_MODULE,
} from './founder-sensemaking-types.js';

export type {
  SensemakingFindingType,
  SensemakingSeverity,
  SensemakingFinding,
  SensemakingUpgrade,
  SensemakingFeedEvent,
  FounderSensemakingAssessment,
} from './founder-sensemaking-types.js';

export {
  assessFounderSensemaking,
  resetFounderSensemakingCounterForTests,
  type FounderSensemakingWorkspaceInput,
  type FounderSensemakingV4Context,
  type FounderSensemakingShellSources,
} from './founder-sensemaking-authority.js';

export {
  getCachedFounderSensemaking,
  setCachedFounderSensemaking,
  resetFounderSensemakingCacheForTests,
} from './founder-sensemaking-cache.js';
