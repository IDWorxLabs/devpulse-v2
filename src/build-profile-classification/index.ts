/**
 * Build Profile Classification — public API.
 */

export {
  BUILD_PROFILE_CLASSIFICATION_PASS_TOKEN,
  type ProfileRankingResult,
  type ProfileAlignmentVerdict,
  type ProfileRankingConfidence,
  type RejectedProfileRanking,
} from './profile-ranking-types.js';

export { rankBuildProfiles, rankBuildProfilesForSelected, matchProfileKeyword } from './profile-ranking-engine.js';
