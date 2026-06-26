/**
 * Virtual Device Laboratory — repair recommendation.
 */

import type { DeviceFailureReport, DeviceRepairRecommendation } from './virtual-device-types.js';

let recommendationCounter = 0;

export function recommendDeviceRepair(failure: DeviceFailureReport): DeviceRepairRecommendation {
  recommendationCounter += 1;
  return {
    readOnly: true,
    recommendationId: `vdev-repair-${recommendationCounter}`,
    failureId: failure.failureId,
    suggestedRepairScope: `Targeted repair for ${failure.category} on ${failure.profileId}`,
    affectedDeviceProfiles: [failure.profileId],
    affectedFeatureSliceIds: [failure.featureSliceId],
    affectedComponents: [`src/features/${failure.target.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`],
    affectedStyles: ['responsive-layout', 'theme-tokens'],
    affectedRoutes: ['/'],
    affectedInteractionTargets: [failure.target],
    promptRequirementLinks: [],
    virtualUserLinks: failure.virtualUserId ? [failure.virtualUserId] : [],
    regressionRisk: failure.category === 'PERFORMANCE_DEGRADED' ? 'MEDIUM' : 'HIGH',
    validationRequiredAfterRepair: [
      'VIRTUAL_DEVICE_LABORATORY',
      'VIRTUAL_USER_SIMULATION',
      'REGRESSION_GUARD',
    ],
  };
}

export function resetDeviceRepairRecommenderForTests(): void {
  recommendationCounter = 0;
}
