/**
 * Interaction Proof Engine — repair recommendation.
 */

import type { InteractionFailureReport, InteractionRepairRecommendation } from './interaction-proof-types.js';

let recommendationCounter = 0;

export function recommendInteractionRepair(failure: InteractionFailureReport): InteractionRepairRecommendation {
  recommendationCounter += 1;
  return {
    readOnly: true,
    recommendationId: `ix-repair-${recommendationCounter}`,
    failureId: failure.failureId,
    suggestedRepairScope: `Targeted repair for ${failure.category} on ${failure.interactionLabel}`,
    responsibleFeatureSliceId: failure.featureSliceId,
    responsibleComponent: failure.responsibleArtifact,
    responsibleHandler: failure.interactionLabel.toLowerCase().replace(/[^a-z0-9]+/g, '') + 'Handler',
    responsibleService: `${failure.featureSliceId}.service`,
    affectedStateOwner: failure.featureSliceId,
    affectedDataStore: failure.featureSliceId,
    affectedDeviceProfiles: failure.deviceProfiles,
    affectedVirtualUsers: [],
    promptRequirementLinks: failure.requirementIds,
    regressionRisk: failure.category === 'HANDLER_NOT_BOUND' ? 'HIGH' : 'MEDIUM',
    validationRequiredAfterRepair: [
      'INTERACTION_PROOF',
      'BEHAVIOR_SIMULATION',
      'VIRTUAL_USER_SIMULATION',
      'VIRTUAL_DEVICE_LABORATORY',
    ],
  };
}

export function resetInteractionRepairRecommenderForTests(): void {
  recommendationCounter = 0;
}
