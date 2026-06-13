/**
 * Product evolution verdict engine — evidence-only evolution state derivation.
 */

import {
  ADAPTIVE_PRODUCT_THRESHOLD,
  EVOLVING_PRODUCT_THRESHOLD,
  LEARNING_PRODUCT_THRESHOLD,
  PRODUCT_EVOLUTION_REALITY_CORE_QUESTION,
  REACTIVE_PRODUCT_THRESHOLD,
} from './product-evolution-reality-registry.js';
import type {
  EvolutionRiskAnalysis,
  FailureLearningAnalysis,
  FeedbackLearningAnalysis,
  ImprovementVelocityAnalysis,
  ProductEvolutionState,
  ProductEvolutionVerdict,
  RevenueLearningAnalysis,
  UsageLearningAnalysis,
} from './product-evolution-reality-types.js';

export function computeProductEvolutionVerdict(input: {
  feedbackLearning: FeedbackLearningAnalysis;
  failureLearning: FailureLearningAnalysis;
  usageLearning: UsageLearningAnalysis;
  revenueLearning: RevenueLearningAnalysis;
  improvementVelocity: ImprovementVelocityAnalysis;
  evolutionRisk: EvolutionRiskAnalysis;
  overallEvolutionScore: number;
  productLaunched: boolean;
  rejectFabricated?: boolean;
  featureAdditionsOnly?: boolean;
  roadmapOnly?: boolean;
}): ProductEvolutionVerdict {
  const missingEvidence = [
    ...input.feedbackLearning.missingEvidence,
    ...input.failureLearning.missingEvidence,
    ...input.usageLearning.missingEvidence,
    ...input.revenueLearning.missingEvidence,
    ...input.improvementVelocity.missingEvidence,
  ].slice(0, 12);

  const riskSignals = [
    ...input.feedbackLearning.riskSignals,
    ...input.failureLearning.riskSignals,
    ...input.usageLearning.riskSignals,
    ...input.revenueLearning.riskSignals,
    ...input.improvementVelocity.riskSignals,
    ...input.evolutionRisk.riskSignals,
  ];

  const feedbackLearningObserved =
    input.feedbackLearning.userFeedbackProcessed &&
    (input.feedbackLearning.customerPainResolution || input.feedbackLearning.featureRequestResponse);
  const failureLearningObserved =
    input.failureLearning.bugFixLearning &&
    (input.failureLearning.rootCauseLearning || input.failureLearning.repeatedFailureReduction);
  const usageLearningObserved =
    input.usageLearning.behaviorInformedChanges && input.usageLearning.usageDrivenImprovements;
  const revenueLearningObserved =
    input.revenueLearning.revenueInformedDecisions || input.revenueLearning.customerValueImprovements;

  const anyLearningObserved =
    feedbackLearningObserved || failureLearningObserved || usageLearningObserved || revenueLearningObserved;

  let productEvolutionState: ProductEvolutionState = 'STATIC_PRODUCT';
  const keyFindings: string[] = [];
  const recommendedActions: string[] = [];

  if (input.rejectFabricated || input.featureAdditionsOnly || input.roadmapOnly) {
    productEvolutionState = 'STATIC_PRODUCT';
    keyFindings.push('Evolution cannot be claimed from feature additions, roadmap updates, or fabricated feedback');
    recommendedActions.push('Provide feedback, failure, usage, or revenue learning evidence with verifiable paths');
    if (input.rejectFabricated) {
      keyFindings.unshift('Fabricated feedback rejected — evidence-only verdict enforced');
    }
  } else if (!input.productLaunched) {
    productEvolutionState = 'STATIC_PRODUCT';
    keyFindings.push('Product not launched — evolution cannot be assessed from pre-launch state');
    recommendedActions.push('Launch product and collect post-launch learning evidence');
  } else if (!anyLearningObserved) {
    productEvolutionState = 'STATIC_PRODUCT';
    keyFindings.push('No observed learning from feedback, failures, usage, or revenue');
    recommendedActions.push('Connect issue trackers, feedback reports, and release changelogs');
    missingEvidence.push('Feedback, failure, or usage learning evidence');
  } else if (
    input.overallEvolutionScore >= ADAPTIVE_PRODUCT_THRESHOLD &&
    feedbackLearningObserved &&
    usageLearningObserved &&
    input.improvementVelocity.adaptationResponsiveness
  ) {
    productEvolutionState = 'ADAPTIVE_PRODUCT';
    keyFindings.push('Adaptive product — multi-signal learning with responsive improvement velocity');
    recommendedActions.push('Maintain evidence-to-action loops and monitor stagnation risk');
  } else if (
    input.overallEvolutionScore >= EVOLVING_PRODUCT_THRESHOLD &&
    anyLearningObserved &&
    input.improvementVelocity.evidenceToActionSpeed
  ) {
    productEvolutionState = 'EVOLVING_PRODUCT';
    keyFindings.push('Product evolving from real-world evidence with measurable improvement velocity');
    recommendedActions.push('Strengthen revenue learning and failure reduction signals');
  } else if (input.overallEvolutionScore >= LEARNING_PRODUCT_THRESHOLD && anyLearningObserved) {
    productEvolutionState = 'LEARNING_PRODUCT';
    keyFindings.push('Product learning from reality — evidence-to-action patterns forming');
    recommendedActions.push('Increase improvement velocity and cross-signal learning');
  } else if (
    (failureLearningObserved || feedbackLearningObserved) &&
    input.overallEvolutionScore >= REACTIVE_PRODUCT_THRESHOLD
  ) {
    productEvolutionState = 'REACTIVE_PRODUCT';
    keyFindings.push('Reactive product — responding to failures or feedback but limited systemic learning');
    recommendedActions.push('Connect usage and revenue signals to drive proactive evolution');
  } else if (anyLearningObserved) {
    productEvolutionState = 'REACTIVE_PRODUCT';
    keyFindings.push('Early reactive signals detected — evolution not yet systemic');
    recommendedActions.push('Document evidence-to-action in release notes and changelogs');
  } else {
    productEvolutionState = 'STATIC_PRODUCT';
  }

  const confidenceBase = Math.round(
    input.overallEvolutionScore * 0.35 +
      (feedbackLearningObserved ? 15 : 0) +
      (failureLearningObserved ? 15 : 0) +
      (usageLearningObserved ? 15 : 0) +
      (revenueLearningObserved ? 10 : 0) +
      (input.improvementVelocity.evidenceToActionSpeed ? 10 : 0),
  );
  const confidence = Math.min(100, Math.max(0, confidenceBase));

  const finalVerdict =
    `${PRODUCT_EVOLUTION_REALITY_CORE_QUESTION} → ${productEvolutionState}. ` +
    (anyLearningObserved
      ? 'Learning signals observed from real-world evidence.'
      : 'No evolution evidence — changes and roadmaps alone are insufficient.');

  return {
    readOnly: true,
    productEvolutionState,
    overallEvolutionScore: input.overallEvolutionScore,
    confidence,
    feedbackLearningObserved,
    failureLearningObserved,
    usageLearningObserved,
    revenueLearningObserved,
    riskSignals: [...new Set(riskSignals)].slice(0, 12),
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    keyFindings: [...new Set(keyFindings)].slice(0, 8),
    recommendedActions: [...new Set(recommendedActions)].slice(0, 8),
    finalVerdict,
  };
}
