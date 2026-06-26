/**
 * Behavior Simulation Engine — behavior repair recommendation.
 */

import type { BehaviorFailureReport, BehaviorRepairRecommendation } from './behavior-simulation-types.js';
import type { BehaviorScenario } from './behavior-simulation-types.js';

let recommendationCounter = 0;

export function recommendBehaviorRepair(input: {
  failure: BehaviorFailureReport;
  scenario: BehaviorScenario;
}): BehaviorRepairRecommendation {
  recommendationCounter += 1;
  const regressionRisk =
    input.failure.category === 'HANDLER_NOT_CONNECTED' ? 'LOW' :
    input.failure.category === 'DATA_NOT_UPDATED' ? 'HIGH' : 'MEDIUM';

  return {
    readOnly: true,
    recommendationId: `beh-repair-${recommendationCounter}`,
    failureId: input.failure.failureId,
    classification: input.failure.category,
    affectedRequirementIds: input.scenario.sourceRequirementIds,
    affectedFeatureSliceIds: input.scenario.featureSliceIds,
    affectedCapabilityIds: input.scenario.capabilityIds,
    responsibleFiles: [input.failure.responsibleArtifact],
    suggestedRepairScope: `Targeted repair for ${input.failure.category} in ${input.failure.responsibleFeatureSliceId}`,
    validationNeededAfterRepair: ['BEHAVIOR_SIMULATION', 'REGRESSION_GUARD', 'PROMPT_FAITHFULNESS'],
    regressionRisk,
  };
}

export function resetBehaviorRepairRecommenderForTests(): void {
  recommendationCounter = 0;
}
