/**
 * Continuous Product Improvement Engine — improvement safety assessment.
 */

import type {
  ImprovementOpportunity,
  ImprovementSafetyAssessment,
  ImprovementStrategy,
} from './continuous-improvement-types.js';

export function resetImprovementSafetyAssessorForTests(): void {
  // stateless assessor
}

function strategyForOpportunity(opp: ImprovementOpportunity): ImprovementStrategy {
  switch (opp.category) {
    case 'USABILITY_IMPROVEMENT':
      return /emergency|too many steps/i.test(opp.summary) ? 'REDUCE_STEPS' : 'REFINE_COPY';
    case 'ACCESSIBILITY_IMPROVEMENT':
      return 'IMPROVE_ACCESSIBLE_LABEL';
    case 'PERFORMANCE_OPTIMIZATION':
      return 'OPTIMIZE_RENDER_PATH';
    case 'MEMORY_OPTIMIZATION':
      return 'REDUCE_RE_RENDER';
    case 'RESPONSIVE_LAYOUT_IMPROVEMENT':
      return 'IMPROVE_RESPONSIVE_LAYOUT';
    case 'ERROR_HANDLING_IMPROVEMENT':
      return 'IMPROVE_ERROR_MESSAGE';
    case 'NAVIGATION_IMPROVEMENT':
      return 'IMPROVE_NAVIGATION_CLARITY';
    case 'EDGE_CASE_HANDLING':
      return 'ADD_EDGE_CASE_HANDLING';
    case 'RELIABILITY_IMPROVEMENT':
      return 'ADD_RETRY_HANDLING';
    case 'DATA_INTEGRITY_IMPROVEMENT':
      return 'IMPROVE_DATA_GUARD';
    default:
      return 'REFINE_COPY';
  }
}

export function resolveImprovementStrategy(opp: ImprovementOpportunity): ImprovementStrategy {
  return strategyForOpportunity(opp);
}

export function assessImprovementSafety(input: {
  opportunity: ImprovementOpportunity;
  simulateUnsafeImprovement?: boolean;
}): ImprovementSafetyAssessment {
  const strategy = strategyForOpportunity(input.opportunity);
  const removesRequiredWorkflow =
    input.simulateUnsafeImprovement ||
    /remove.*required prompt workflow/i.test(input.opportunity.summary);

  const promptFaithfulnessRisk = removesRequiredWorkflow ? 'BLOCKING' : (
    input.opportunity.promptFaithfulnessRisk === 'HIGH' ? 'HIGH' : 'LOW'
  ) as ImprovementSafetyAssessment['promptFaithfulnessRisk'];

  const unsafe =
    promptFaithfulnessRisk === 'BLOCKING' ||
    (strategy === 'REDUCE_STEPS' && removesRequiredWorkflow);

  return {
    readOnly: true,
    opportunityId: input.opportunity.opportunityId,
    safe: !unsafe,
    promptFaithfulnessRisk,
    regressionRisk: input.opportunity.category === 'PERFORMANCE_OPTIMIZATION' ? 'MEDIUM' : 'LOW',
    securityRisk: 'LOW',
    dataLossRisk: 'LOW',
    accessibilityRisk: strategy === 'IMPROVE_ACCESSIBLE_LABEL' ? 'LOW' : 'LOW',
    behaviorDriftRisk: removesRequiredWorkflow ? 'BLOCKING' : 'LOW',
    capabilityDriftRisk: 'LOW',
    architectureDriftRisk: input.opportunity.category === 'QUALITY_REFACTOR' ? 'MEDIUM' : 'LOW',
    performanceRegressionRisk:
      input.opportunity.category === 'PERFORMANCE_OPTIMIZATION' ? 'MEDIUM' : 'LOW',
    userSafetyRisk: /emergency/i.test(input.opportunity.summary) && removesRequiredWorkflow
      ? 'BLOCKING'
      : 'LOW',
    blockedReason: unsafe
      ? 'Improvement would remove required prompt workflow — prompt faithfulness risk'
      : null,
  };
}
