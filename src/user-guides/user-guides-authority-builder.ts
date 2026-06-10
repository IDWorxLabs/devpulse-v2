/**
 * User Guides — authority builder.
 */

import type {
  FeatureDiscoveryGuideAnalysis,
  OnboardingGuideAnalysis,
  ResultsInterpretationGuideAnalysis,
  SafetyGuideAnalysis,
  UnifiedUserGuidesAuthority,
  UserGuideCompletenessLevel,
  UserGuideState,
  UserGuidesInput,
  WorkflowGuideAnalysis,
} from './user-guides-types.js';
import {
  resolveUserGuideCompletenessLevel,
  resolveUserGuideState,
} from './user-guides-types.js';
import {
  getCachedUserGuidesAuthority,
  setCachedUserGuidesAuthority,
} from './user-guides-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedUserGuidesAuthority(
  requestId: string,
  onboarding: OnboardingGuideAnalysis,
  workflow: WorkflowGuideAnalysis,
  feature: FeatureDiscoveryGuideAnalysis,
  safety: SafetyGuideAnalysis,
  interpretation: ResultsInterpretationGuideAnalysis,
  input: UserGuidesInput,
): UnifiedUserGuidesAuthority {
  const cacheKey = [
    requestId,
    onboarding.onboardingCoverageScore,
    workflow.workflowCoverageScore,
    feature.featureCoverageScore,
    safety.safetyCoverageScore,
    interpretation.interpretationCoverageScore,
  ].join('|');

  const cached = getCachedUserGuidesAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const userCoverageScore = Math.max(0, Math.min(100, Math.round(
    onboarding.onboardingCoverageScore * 0.2
      + workflow.workflowCoverageScore * 0.2
      + feature.featureCoverageScore * 0.2
      + safety.safetyCoverageScore * 0.2
      + interpretation.interpretationCoverageScore * 0.2,
  )));

  const completenessLevel: UserGuideCompletenessLevel = resolveUserGuideCompletenessLevel(
    userCoverageScore,
  );
  const state: UserGuideState = resolveUserGuideState(
    userCoverageScore,
    input.governanceBlocked,
  );
  const confidence = Math.min(100, Math.round(
    (userCoverageScore + onboarding.onboardingCoverageScore + feature.featureCoverageScore) / 3,
  ));

  const authority: UnifiedUserGuidesAuthority = {
    authorityId: `user-guides-authority-${authorityCounter}`,
    userCoverageScore,
    onboardingCoverageScore: onboarding.onboardingCoverageScore,
    workflowCoverageScore: workflow.workflowCoverageScore,
    featureCoverageScore: feature.featureCoverageScore,
    safetyCoverageScore: safety.safetyCoverageScore,
    interpretationCoverageScore: interpretation.interpretationCoverageScore,
    completenessLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedUserGuidesAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetUserGuidesAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
