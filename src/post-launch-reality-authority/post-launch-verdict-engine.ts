/**
 * Post-launch verdict engine — evidence-only state derivation.
 */

import {
  ACTIVE_USAGE_THRESHOLD,
  ESTABLISHED_PRODUCT_THRESHOLD,
  GROWING_PRODUCT_THRESHOLD,
  POST_LAUNCH_REALITY_CORE_QUESTION,
} from './post-launch-reality-registry.js';
import type {
  BusinessOutcomeAnalysis,
  EngagementEvidenceAnalysis,
  ErrorRealityAnalysis,
  PostLaunchRealityState,
  PostLaunchVerdict,
  RetentionEvidenceAnalysis,
  TrafficEvidenceAnalysis,
} from './post-launch-reality-types.js';

export function computePostLaunchVerdict(input: {
  launchObserved: boolean;
  traffic: TrafficEvidenceAnalysis;
  engagement: EngagementEvidenceAnalysis;
  retention: RetentionEvidenceAnalysis;
  reliability: ErrorRealityAnalysis;
  businessOutcome: BusinessOutcomeAnalysis;
  overallPostLaunchScore: number;
  rejectFabricated?: boolean;
}): PostLaunchVerdict {
  const missingEvidence = [
    ...input.traffic.missingEvidence,
    ...input.engagement.missingEvidence,
    ...input.retention.missingEvidence,
    ...input.reliability.missingEvidence,
    ...input.businessOutcome.missingEvidence,
  ].slice(0, 12);

  const riskSignals = [
    ...input.traffic.riskSignals,
    ...input.engagement.riskSignals,
    ...input.retention.riskSignals,
    ...input.reliability.riskSignals,
    ...input.businessOutcome.riskSignals,
  ];

  const activityObserved = input.traffic.trafficObserved && (input.traffic.sessionsObserved ?? 0) > 0;
  const retentionObserved =
    input.retention.repeatUsers &&
    input.retention.retentionSignals &&
    input.traffic.trafficObserved;
  const businessValueObserved =
    input.businessOutcome.customerValueEvidence ||
    input.businessOutcome.productImpactEvidence ||
    input.businessOutcome.monetizationEvidence;

  let postLaunchRealityState: PostLaunchRealityState = 'NOT_LAUNCHED';
  const keyFindings: string[] = [];
  const recommendedActions: string[] = [];

  if (!input.launchObserved) {
    postLaunchRealityState = 'NOT_LAUNCHED';
    keyFindings.push('Product not observed as launched — post-launch reality cannot be assessed');
    recommendedActions.push('Complete launch before evaluating post-launch reality');
  } else if (!activityObserved) {
    postLaunchRealityState = 'LAUNCHED_NO_ACTIVITY';
    keyFindings.push('Launch observed but no post-launch traffic or session evidence');
    recommendedActions.push('Connect analytics or usage reports to observe real post-launch activity');
    missingEvidence.push('Post-launch traffic/session evidence');
  } else if (input.overallPostLaunchScore >= ESTABLISHED_PRODUCT_THRESHOLD && retentionObserved && businessValueObserved) {
    postLaunchRealityState = 'ESTABLISHED_PRODUCT';
    keyFindings.push('Strong post-launch scores with retention and business value evidence');
    recommendedActions.push('Continue monitoring retention and operational stability');
  } else if (input.overallPostLaunchScore >= GROWING_PRODUCT_THRESHOLD && retentionObserved) {
    postLaunchRealityState = 'GROWING_PRODUCT';
    keyFindings.push('Growing usage with retention signals observed');
    recommendedActions.push('Invest in features driving repeat usage and business outcomes');
  } else if (input.overallPostLaunchScore >= ACTIVE_USAGE_THRESHOLD && activityObserved) {
    postLaunchRealityState = 'ACTIVE_USAGE';
    keyFindings.push('Active post-launch usage observed');
    recommendedActions.push('Track retention and business outcome evidence');
  } else if (activityObserved) {
    postLaunchRealityState = 'EARLY_ACTIVITY';
    keyFindings.push('Early post-launch activity detected — engagement and retention still forming');
    recommendedActions.push('Monitor session quality and repeat user signals');
  } else {
    postLaunchRealityState = 'LAUNCHED_NO_ACTIVITY';
  }

  if (input.rejectFabricated) {
    postLaunchRealityState = input.launchObserved ? 'LAUNCHED_NO_ACTIVITY' : 'NOT_LAUNCHED';
    keyFindings.unshift('Fabricated or unverifiable metrics rejected — evidence-only verdict enforced');
    recommendedActions.unshift('Provide observed analytics with verifiable evidence paths');
  }

  const confidenceBase = Math.round(
    input.overallPostLaunchScore * 0.4 +
      (activityObserved ? 25 : 0) +
      (retentionObserved ? 20 : 0) +
      (businessValueObserved ? 15 : 0),
  );
  const confidence = Math.min(100, Math.max(0, confidenceBase));

  const finalVerdict =
    `${POST_LAUNCH_REALITY_CORE_QUESTION} → ${postLaunchRealityState}. ` +
    (activityObserved
      ? `Activity observed (${input.traffic.sessionsObserved ?? 0} sessions, ${input.traffic.usersObserved ?? 0} users).`
      : 'No post-launch activity evidence.');

  return {
    readOnly: true,
    postLaunchRealityState,
    overallPostLaunchScore: input.overallPostLaunchScore,
    confidence,
    activityObserved,
    retentionObserved,
    businessValueObserved,
    riskSignals: [...new Set(riskSignals)].slice(0, 10),
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    keyFindings: [...new Set(keyFindings)].slice(0, 8),
    recommendedActions: [...new Set(recommendedActions)].slice(0, 8),
    finalVerdict,
  };
}
