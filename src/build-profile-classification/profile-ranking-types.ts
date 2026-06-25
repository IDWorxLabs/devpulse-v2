/**
 * Build Profile Classification — ranked profile selection types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';

export const BUILD_PROFILE_CLASSIFICATION_PASS_TOKEN = 'BUILD_PROFILE_CLASSIFICATION_PASS';

export type ProfileRankingConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type ProfileAlignmentVerdict = 'ALIGNED' | 'PROFILE_MISMATCH' | 'NOT_ALIGNED';

export interface ProfileKeywordRule {
  term: string;
  weight: number;
}

export interface RejectedProfileRanking {
  profile: GeneratedAppProfile;
  score: number;
  matchedKeywords: string[];
  rejectionReason: string;
}

export interface ProfileRankingResult {
  readOnly: true;
  selectedProfile: GeneratedAppProfile | null;
  confidence: ProfileRankingConfidence;
  matchedKeywords: string[];
  rejectedProfiles: RejectedProfileRanking[];
  rejectionReasons: string[];
  fallbackReason: string | null;
  rankings: Array<{
    profile: GeneratedAppProfile;
    score: number;
    matchedKeywords: string[];
  }>;
  inferredProductIntent: string | null;
  profileMismatchWarnings: string[];
  alignmentVerdict: ProfileAlignmentVerdict;
  alignmentReason: string;
  reason: string;
}
