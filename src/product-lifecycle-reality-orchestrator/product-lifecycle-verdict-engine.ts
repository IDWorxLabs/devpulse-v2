/**
 * Product lifecycle verdict engine — unified lifecycle verdict derivation.
 */

import { PRODUCT_LIFECYCLE_REALITY_CORE_QUESTION } from './product-lifecycle-reality-registry.js';
import type {
  LifecycleGapAnalysis,
  LifecycleNextActionResult,
  LifecycleRiskAnalysis,
  LifecycleScoreBreakdown,
  LifecycleStageClassification,
  ProductLifecycleVerdict,
} from './product-lifecycle-reality-types.js';

export function computeProductLifecycleVerdict(input: {
  stageClassification: LifecycleStageClassification;
  scores: LifecycleScoreBreakdown;
  gapAnalysis: LifecycleGapAnalysis;
  riskAnalysis: LifecycleRiskAnalysis;
  nextAction: LifecycleNextActionResult;
  canScaleNow: boolean;
}): ProductLifecycleVerdict {
  const keyFindings: string[] = [];
  const recommendedActions: string[] = [];

  keyFindings.push(
    `Highest proven lifecycle stage: ${input.stageClassification.highestProvenStage}`,
  );
  keyFindings.push(input.stageClassification.classificationReason);
  keyFindings.push(`Next required action: ${input.nextAction.nextRequiredAction} — ${input.nextAction.actionReason}`);

  if (input.gapAnalysis.brokenProofLinks.length > 0) {
    keyFindings.push(`Broken proof links: ${input.gapAnalysis.brokenProofLinks.join('; ')}`);
    recommendedActions.push('Repair broken proof chain before advancing lifecycle state');
  }

  if (input.riskAnalysis.lifecycleStagnationRisk) {
    keyFindings.push('Lifecycle stagnation risk — product may not be evolving from reality');
    recommendedActions.push('Connect feedback, usage, and release evidence to drive evolution');
  }

  if (input.canScaleNow) {
    keyFindings.push('Scaling signals proven — product ready for evidence-backed scale evaluation');
    recommendedActions.push('Monitor lifecycle risks while scaling with continued evidence collection');
  } else if (input.stageClassification.highestProvenStage === 'REVENUE_GENERATING') {
    recommendedActions.push('Prove product evolution learning before claiming scaling readiness');
  }

  recommendedActions.push(`Execute next action: ${input.nextAction.nextRequiredAction}`);

  const missingEvidence = [
    ...input.gapAnalysis.missingEvidence,
    ...input.gapAnalysis.weakEvidence,
  ].slice(0, 12);

  const lifecycleBlockers = input.gapAnalysis.lifecycleBlockers.slice(0, 8);

  const finalVerdict =
    `${PRODUCT_LIFECYCLE_REALITY_CORE_QUESTION} → ${input.stageClassification.productLifecycleRealityState}. ` +
    `Next action: ${input.nextAction.nextRequiredAction}. ` +
    (input.nextAction.evidenceBacked
      ? 'Decision backed by observed lifecycle evidence.'
      : 'Insufficient evidence — action remains advisory until proof is collected.');

  return {
    readOnly: true,
    productLifecycleRealityState: input.stageClassification.productLifecycleRealityState,
    overallLifecycleScore: input.scores.overallLifecycleScore,
    lifecycleConfidenceScore: input.scores.lifecycleConfidenceScore,
    highestProvenStage: input.stageClassification.highestProvenStage,
    nextRequiredAction: input.nextAction.nextRequiredAction,
    canScaleNow: input.canScaleNow,
    keyFindings: [...new Set(keyFindings)].slice(0, 8),
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    lifecycleBlockers,
    riskSignals: input.riskAnalysis.riskSignals.slice(0, 10),
    recommendedActions: [...new Set(recommendedActions)].slice(0, 8),
    finalVerdict,
  };
}

export function computeLifecycleScores(input: {
  liveExecutionRunner: import('../live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-types.js').LiveIdeaToLaunchExecutionRunnerReport | null;
  founderLaunchDecision: import('../founder-launch-decision-authority/founder-launch-decision-authority-types.js').FounderLaunchDecisionReport | null;
  postLaunchReality: import('../post-launch-reality-authority/post-launch-reality-types.js').PostLaunchRealityReport | null;
  adoptionReality: import('../adoption-reality-authority/adoption-reality-types.js').AdoptionRealityReport | null;
  revenueReality: import('../revenue-reality-authority/revenue-reality-types.js').RevenueRealityReport | null;
  productEvolutionReality: import('../product-evolution-reality-authority/product-evolution-reality-types.js').ProductEvolutionRealityReport | null;
  stageClassification: LifecycleStageClassification;
}): LifecycleScoreBreakdown {
  const executionScore = input.liveExecutionRunner?.overallExecutionScore ?? 0;
  const launchScore = Math.round(
    (input.founderLaunchDecision?.decisionConfidence ?? 0) * 0.5 +
      (input.founderLaunchDecision?.proofSignals.proofChainScore ?? 0) * 0.5,
  );
  const postLaunchScore = input.postLaunchReality?.overallPostLaunchScore ?? 0;
  const adoptionScore = input.adoptionReality?.overallAdoptionScore ?? 0;
  const revenueScore = input.revenueReality?.overallRevenueScore ?? 0;
  const evolutionScore = input.productEvolutionReality?.overallEvolutionScore ?? 0;

  const provenCount = input.stageClassification.provenStages.length;
  const lifecycleConfidenceScore = Math.min(
    100,
    Math.round(provenCount * 9 + (input.founderLaunchDecision?.decisionConfidence ?? 0) * 0.15),
  );

  const overallLifecycleScore = Math.round(
    executionScore * 0.18 +
      launchScore * 0.12 +
      postLaunchScore * 0.12 +
      adoptionScore * 0.15 +
      revenueScore * 0.18 +
      evolutionScore * 0.15 +
      lifecycleConfidenceScore * 0.1,
  );

  return {
    readOnly: true,
    executionScore,
    launchScore,
    postLaunchScore,
    adoptionScore,
    revenueScore,
    evolutionScore,
    lifecycleConfidenceScore,
    overallLifecycleScore: Math.min(100, Math.max(0, overallLifecycleScore)),
  };
}
