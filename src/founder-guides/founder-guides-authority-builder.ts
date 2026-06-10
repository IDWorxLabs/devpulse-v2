/**
 * Founder Guides — authority builder.
 */

import type {
  CheckpointGuideAnalysis,
  EvolutionGuideAnalysis,
  FounderGuideCompletenessLevel,
  FounderGuideState,
  FounderGuidesInput,
  ModificationSafetyGuideAnalysis,
  RoadmapGuideAnalysis,
  SystemNavigationGuideAnalysis,
  UnifiedFounderGuidesAuthority,
} from './founder-guides-types.js';
import {
  resolveFounderGuideCompletenessLevel,
  resolveFounderGuideState,
} from './founder-guides-types.js';
import {
  getCachedFounderGuidesAuthority,
  setCachedFounderGuidesAuthority,
} from './founder-guides-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedFounderGuidesAuthority(
  requestId: string,
  roadmap: RoadmapGuideAnalysis,
  checkpoint: CheckpointGuideAnalysis,
  navigation: SystemNavigationGuideAnalysis,
  safety: ModificationSafetyGuideAnalysis,
  evolution: EvolutionGuideAnalysis,
  input: FounderGuidesInput,
): UnifiedFounderGuidesAuthority {
  const cacheKey = [
    requestId,
    roadmap.roadmapCoverageScore,
    checkpoint.checkpointCoverageScore,
    navigation.navigationCoverageScore,
    safety.safetyCoverageScore,
    evolution.evolutionCoverageScore,
  ].join('|');

  const cached = getCachedFounderGuidesAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const founderCoverageScore = Math.max(0, Math.min(100, Math.round(
    roadmap.roadmapCoverageScore * 0.2
      + checkpoint.checkpointCoverageScore * 0.2
      + navigation.navigationCoverageScore * 0.2
      + safety.safetyCoverageScore * 0.2
      + evolution.evolutionCoverageScore * 0.2,
  )));

  const completenessLevel: FounderGuideCompletenessLevel = resolveFounderGuideCompletenessLevel(
    founderCoverageScore,
  );
  const state: FounderGuideState = resolveFounderGuideState(
    founderCoverageScore,
    input.governanceBlocked,
  );
  const confidence = Math.min(100, Math.round(
    (founderCoverageScore + roadmap.roadmapCoverageScore + checkpoint.checkpointCoverageScore) / 3,
  ));

  const authority: UnifiedFounderGuidesAuthority = {
    authorityId: `founder-guides-authority-${authorityCounter}`,
    founderCoverageScore,
    roadmapCoverageScore: roadmap.roadmapCoverageScore,
    checkpointCoverageScore: checkpoint.checkpointCoverageScore,
    navigationCoverageScore: navigation.navigationCoverageScore,
    safetyCoverageScore: safety.safetyCoverageScore,
    evolutionCoverageScore: evolution.evolutionCoverageScore,
    completenessLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedFounderGuidesAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetFounderGuidesAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
