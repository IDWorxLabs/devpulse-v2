/**
 * Build Result Conversational Intelligence V1 — profile classification evidence.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { rankBuildProfilesForSelected } from '../build-profile-classification/index.js';
import type { BuildProfileClassificationEvidence } from './build-result-conversational-types.js';

export function analyzeBuildProfileClassification(
  userPrompt: string,
  selectedProfile: GeneratedAppProfile | null,
): BuildProfileClassificationEvidence {
  const ranking = rankBuildProfilesForSelected(userPrompt, selectedProfile);

  return {
    readOnly: true,
    category: 'BUILD',
    confidence: ranking.confidence,
    selectedProfile,
    matchedKeywords: ranking.matchedKeywords,
    matchedSignals: ranking.matchedKeywords.length ? ranking.matchedKeywords : [],
    reason: ranking.reason,
    inferredProductIntent: ranking.inferredProductIntent,
    profileMismatchWarnings: ranking.profileMismatchWarnings,
    rejectedProfiles: ranking.rejectedProfiles.map((entry) => entry.profile),
    rejectionReasons: ranking.rejectionReasons,
    fallbackReason: ranking.fallbackReason,
    alignmentVerdict: ranking.alignmentVerdict,
    alignmentReason: ranking.alignmentReason,
  };
}
