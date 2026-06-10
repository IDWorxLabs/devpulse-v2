/**
 * Product Experience Verification Engine — unified authority builder.
 */

import type {
  ExperienceContinuityVerification,
  FounderExperienceVerification,
  IntelligenceContinuityVerification,
  LaunchReadinessContinuityVerification,
  NavigationContinuityVerification,
  ProductCoherenceVerification,
  ProductExperienceAuthority,
  ProductExperienceInput,
  ProductExperienceResult,
  ProductIdentityContinuityVerification,
  TrustContinuityVerification,
  VerificationContinuityVerification,
  WorkflowContinuityVerification,
} from './product-experience-types.js';
import { MAX_EXPERIENCE_GAPS, resolveProductExperienceResult } from './product-experience-types.js';
import { countCriticalGaps, mergeBoundedGaps } from './experience-gap-model.js';
import { getCachedProductExperienceAuthority, setCachedProductExperienceAuthority } from './product-experience-cache.js';

const VERIFIER_WEIGHT = 0.1;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildProductExperienceAuthority(
  requestId: string,
  coherence: ProductCoherenceVerification,
  experience: ExperienceContinuityVerification,
  intelligence: IntelligenceContinuityVerification,
  workflow: WorkflowContinuityVerification,
  navigation: NavigationContinuityVerification,
  verification: VerificationContinuityVerification,
  founder: FounderExperienceVerification,
  trust: TrustContinuityVerification,
  identity: ProductIdentityContinuityVerification,
  launch: LaunchReadinessContinuityVerification,
  input: ProductExperienceInput,
): ProductExperienceAuthority {
  const cacheKey = [
    requestId,
    coherence.continuityScore, experience.continuityScore, intelligence.continuityScore,
    workflow.continuityScore, navigation.continuityScore, verification.continuityScore,
    founder.continuityScore, trust.continuityScore, identity.continuityScore, launch.continuityScore,
  ].join('|');

  const cached = getCachedProductExperienceAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const allGaps = mergeBoundedGaps(
    [
      coherence.gaps, experience.gaps, intelligence.gaps, workflow.gaps, navigation.gaps,
      verification.gaps, founder.gaps, trust.gaps, identity.gaps, launch.gaps,
    ],
    MAX_EXPERIENCE_GAPS,
  );

  const overallScore = Math.round(
    coherence.continuityScore * VERIFIER_WEIGHT
      + experience.continuityScore * VERIFIER_WEIGHT
      + intelligence.continuityScore * VERIFIER_WEIGHT
      + workflow.continuityScore * VERIFIER_WEIGHT
      + navigation.continuityScore * VERIFIER_WEIGHT
      + verification.continuityScore * VERIFIER_WEIGHT
      + founder.continuityScore * VERIFIER_WEIGHT
      + trust.continuityScore * VERIFIER_WEIGHT
      + identity.continuityScore * VERIFIER_WEIGHT
      + launch.continuityScore * VERIFIER_WEIGHT,
  );

  const criticalGaps = countCriticalGaps(allGaps);
  const warningCount = allGaps.filter((g) => g.severity === 'HIGH' || g.severity === 'MEDIUM').length;

  const productExperienceResult: ProductExperienceResult = resolveProductExperienceResult(
    overallScore,
    criticalGaps,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (overallScore + trust.continuityScore + founder.continuityScore) / 3,
  ));

  const authority: ProductExperienceAuthority = {
    authorityId: `product-experience-authority-${authorityCounter}`,
    overallScore,
    productCoherenceScore: coherence.continuityScore,
    experienceContinuityScore: experience.continuityScore,
    intelligenceContinuityScore: intelligence.continuityScore,
    workflowContinuityScore: workflow.continuityScore,
    navigationContinuityScore: navigation.continuityScore,
    verificationContinuityScore: verification.continuityScore,
    founderExperienceScore: founder.continuityScore,
    trustContinuityScore: trust.continuityScore,
    productIdentityScore: identity.continuityScore,
    launchReadinessScore: launch.continuityScore,
    readinessLevel: launch.readinessLevel,
    totalGaps: allGaps.length,
    criticalGaps,
    allGaps,
    productExperienceResult,
    confidence,
    createdAt: Date.now(),
  };

  setCachedProductExperienceAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetProductExperienceAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
