/**
 * Adoption verdict engine — evidence-only adoption state derivation.
 */

import {
  ADOPTION_REALITY_CORE_QUESTION,
  CRITICAL_DEPENDENCY_THRESHOLD,
  EARLY_ADOPTION_THRESHOLD,
  EMERGING_ADOPTION_THRESHOLD,
  ESTABLISHED_ADOPTION_THRESHOLD,
} from './adoption-reality-registry.js';
import type {
  AdoptionRealityState,
  AdoptionRiskAnalysis,
  AdoptionVerdict,
  BehavioralIntegrationAnalysis,
  FeatureAdoptionAnalysis,
  RepeatUsageAnalysis,
  UserDependencyAnalysis,
} from './adoption-reality-types.js';

export function computeAdoptionVerdict(input: {
  repeatUsage: RepeatUsageAnalysis;
  behavioralIntegration: BehavioralIntegrationAnalysis;
  featureAdoption: FeatureAdoptionAnalysis;
  userDependency: UserDependencyAnalysis;
  adoptionRisk: AdoptionRiskAnalysis;
  overallAdoptionScore: number;
  postLaunchActivityObserved: boolean;
  rejectFabricated?: boolean;
  trafficOnly?: boolean;
  signupsOnly?: boolean;
  oneTimeUsage?: boolean;
}): AdoptionVerdict {
  const missingEvidence = [
    ...input.repeatUsage.missingEvidence,
    ...input.behavioralIntegration.missingEvidence,
    ...input.featureAdoption.missingEvidence,
    ...input.userDependency.missingEvidence,
  ].slice(0, 12);

  const riskSignals = [
    ...input.repeatUsage.riskSignals,
    ...input.behavioralIntegration.riskSignals,
    ...input.featureAdoption.riskSignals,
    ...input.userDependency.riskSignals,
    ...input.adoptionRisk.riskSignals,
  ];

  const repeatUsageObserved =
    input.repeatUsage.repeatUsers &&
    input.repeatUsage.repeatSessions &&
    input.postLaunchActivityObserved;
  const behavioralIntegrationObserved =
    input.behavioralIntegration.workflowIntegration &&
    input.behavioralIntegration.routineUsageIndicators &&
    repeatUsageObserved;
  const featureAdoptionObserved =
    input.featureAdoption.coreFeatureUsage &&
    input.featureAdoption.featureStickiness &&
    repeatUsageObserved;
  const dependencyObserved =
    input.userDependency.dependencySignals &&
    input.userDependency.operationalImportance &&
    behavioralIntegrationObserved;

  let adoptionRealityState: AdoptionRealityState = 'NO_ADOPTION';
  const keyFindings: string[] = [];
  const recommendedActions: string[] = [];

  if (input.rejectFabricated || input.trafficOnly || input.signupsOnly || input.oneTimeUsage) {
    adoptionRealityState = 'NO_ADOPTION';
    keyFindings.push('Adoption cannot be claimed from traffic, signups, one-time usage, or fabricated metrics');
    recommendedActions.push('Provide repeat usage and behavioral integration evidence with verifiable paths');
    if (input.rejectFabricated) {
      keyFindings.unshift('Fabricated metrics rejected — evidence-only verdict enforced');
    }
  } else if (!input.postLaunchActivityObserved) {
    adoptionRealityState = 'NO_ADOPTION';
    keyFindings.push('Post-launch activity not observed — adoption cannot be assessed');
    recommendedActions.push('Establish post-launch activity evidence before assessing adoption');
  } else if (!repeatUsageObserved) {
    adoptionRealityState = 'NO_ADOPTION';
    keyFindings.push('No repeat usage evidence — users may have tried but not adopted');
    recommendedActions.push('Track repeat sessions and return frequency in usage analytics');
    missingEvidence.push('Repeat user and repeat session evidence');
  } else if (
    input.overallAdoptionScore >= CRITICAL_DEPENDENCY_THRESHOLD &&
    dependencyObserved &&
    featureAdoptionObserved
  ) {
    adoptionRealityState = 'CRITICAL_DEPENDENCY';
    keyFindings.push('Critical user dependency with established feature adoption observed');
    recommendedActions.push('Protect reliability and monitor switching-cost indicators');
  } else if (input.overallAdoptionScore >= ESTABLISHED_ADOPTION_THRESHOLD && featureAdoptionObserved) {
    adoptionRealityState = 'ESTABLISHED_ADOPTION';
    keyFindings.push('Established adoption with core feature stickiness observed');
    recommendedActions.push('Deepen workflow integration and monitor retention');
  } else if (input.overallAdoptionScore >= EMERGING_ADOPTION_THRESHOLD && behavioralIntegrationObserved) {
    adoptionRealityState = 'EMERGING_ADOPTION';
    keyFindings.push('Emerging adoption with behavioral integration signals');
    recommendedActions.push('Strengthen feature depth and dependency indicators');
  } else if (input.overallAdoptionScore >= EARLY_ADOPTION_THRESHOLD && repeatUsageObserved) {
    adoptionRealityState = 'EARLY_ADOPTION';
    keyFindings.push('Early adoption — repeat usage detected but integration still forming');
    recommendedActions.push('Monitor workflow integration and feature stickiness');
  } else {
    adoptionRealityState = 'NO_ADOPTION';
    keyFindings.push('Insufficient adoption evidence beyond initial activity');
    recommendedActions.push('Collect repeat usage and behavioral integration reports');
  }

  const confidenceBase = Math.round(
    input.overallAdoptionScore * 0.35 +
      (repeatUsageObserved ? 25 : 0) +
      (behavioralIntegrationObserved ? 20 : 0) +
      (featureAdoptionObserved ? 12 : 0) +
      (dependencyObserved ? 8 : 0),
  );
  const confidence = Math.min(100, Math.max(0, confidenceBase));

  const finalVerdict =
    `${ADOPTION_REALITY_CORE_QUESTION} → ${adoptionRealityState}. ` +
    (repeatUsageObserved
      ? 'Repeat usage observed — users returning beyond initial trial.'
      : 'No genuine adoption evidence — traffic or one-time usage alone is insufficient.');

  return {
    readOnly: true,
    adoptionRealityState,
    overallAdoptionScore: input.overallAdoptionScore,
    confidence,
    repeatUsageObserved,
    behavioralIntegrationObserved,
    featureAdoptionObserved,
    dependencyObserved,
    riskSignals: [...new Set(riskSignals)].slice(0, 12),
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    keyFindings: [...new Set(keyFindings)].slice(0, 8),
    recommendedActions: [...new Set(recommendedActions)].slice(0, 8),
    finalVerdict,
  };
}
