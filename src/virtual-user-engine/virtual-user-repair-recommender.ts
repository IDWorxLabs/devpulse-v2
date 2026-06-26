/**
 * Virtual User Engine — repair recommendation.
 */

import type { VirtualUserFailureReport, VirtualUserRepairRecommendation } from './virtual-user-types.js';

let recommendationCounter = 0;

export function recommendVirtualUserRepair(failure: VirtualUserFailureReport): VirtualUserRepairRecommendation {
  recommendationCounter += 1;
  return {
    readOnly: true,
    recommendationId: `vu-repair-${recommendationCounter}`,
    failureId: failure.failureId,
    suggestedRepairScope: `Targeted repair for ${failure.category} at ${failure.failedStep}`,
    responsibleFeatureSliceId: failure.affectedFeatureSliceIds[0] ?? 'unknown',
    responsibleBehaviorScenarioId: failure.affectedBehaviorScenarioIds[0] ?? 'unknown',
    responsibleCapabilityId: 'unknown',
    responsibleFiles: [`src/features/${failure.failedStep.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`],
    promptRequirementLinks: failure.affectedRequirementIds,
    accessibilityRisk: failure.category === 'ACCESSIBILITY_BLOCKER' ? 'HIGH' : 'MEDIUM',
    regressionRisk: failure.category === 'BEHAVIOR_FAILED' ? 'HIGH' : 'MEDIUM',
    validationRequiredAfterRepair: ['VIRTUAL_USER_SIMULATION', 'BEHAVIOR_SIMULATION', 'REGRESSION_GUARD'],
  };
}

export function resetVirtualUserRepairRecommenderForTests(): void {
  recommendationCounter = 0;
}
