/**
 * Evolution risk analyzer — stagnation and adaptation risks.
 */

import type {
  EvolutionRiskAnalysis,
  FailureLearningAnalysis,
  FeedbackLearningAnalysis,
  ImprovementVelocityAnalysis,
  UsageLearningAnalysis,
} from './product-evolution-reality-types.js';

export function analyzeEvolutionRisk(input: {
  feedbackLearning: FeedbackLearningAnalysis;
  failureLearning: FailureLearningAnalysis;
  usageLearning: UsageLearningAnalysis;
  improvementVelocity: ImprovementVelocityAnalysis;
  productLaunched: boolean;
  featureAdditionsOnly?: boolean;
  roadmapOnly?: boolean;
}): EvolutionRiskAnalysis {
  const riskSignals: string[] = [];
  let evolutionRiskScore = 0;

  if (!input.productLaunched) {
    evolutionRiskScore += 30;
    riskSignals.push('Product not launched — evolution risk not yet applicable');
  }

  if (input.featureAdditionsOnly) {
    evolutionRiskScore += 35;
    riskSignals.push('Feature additions without learning evidence — stagnation risk');
  }

  if (input.roadmapOnly) {
    evolutionRiskScore += 30;
    riskSignals.push('Roadmap updates without evidence-to-action — innovation risk');
  }

  if (input.feedbackLearning.feedbackLearningScore < 20) {
    evolutionRiskScore += 20;
    riskSignals.push('Feedback ignoring risk — limited feedback learning evidence');
  }

  if (input.failureLearning.failureLearningScore < 20) {
    evolutionRiskScore += 15;
    riskSignals.push('Repeated failures may persist — limited failure learning');
  }

  if (input.usageLearning.usageLearningScore < 20) {
    evolutionRiskScore += 15;
    riskSignals.push('Usage signals not driving improvements — adaptation risk');
  }

  if (input.improvementVelocity.improvementVelocityScore < 25) {
    evolutionRiskScore += 15;
    riskSignals.push('Low improvement velocity — competitive drift risk');
  }

  evolutionRiskScore = Math.min(100, Math.max(0, evolutionRiskScore));

  return {
    readOnly: true,
    stagnationRisk: evolutionRiskScore >= 50 || input.improvementVelocity.improvementVelocityScore < 20,
    feedbackIgnoringRisk: input.feedbackLearning.feedbackLearningScore < 25,
    innovationRisk: Boolean(input.roadmapOnly || input.featureAdditionsOnly),
    adaptationRisk: input.usageLearning.usageLearningScore < 30 && input.productLaunched,
    competitiveDriftRisk: input.improvementVelocity.improvementVelocityScore < 30,
    evolutionRiskScore,
    riskSignals: [...new Set(riskSignals)].slice(0, 10),
  };
}
