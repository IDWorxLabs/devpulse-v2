/**
 * Resource Allocation — priority determination.
 */

import type { AllocateResourcesInput, ResourcePriority } from './resource-allocation-types.js';

const PRIORITY_ORDER: Record<ResourcePriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

export function determineResourcePriority(input: AllocateResourcesInput): ResourcePriority {
  if (input.trustRecovery || input.failedRecovery || input.founderEscalation) {
    return 'CRITICAL';
  }

  if (input.releaseCandidate || input.completionCandidate) {
    return 'HIGH';
  }

  if (input.activeBuild || input.activeTesting) {
    return 'NORMAL';
  }

  if (input.planningOnly || input.backgroundWork) {
    return 'LOW';
  }

  return 'NORMAL';
}

export function compareResourcePriority(a: ResourcePriority, b: ResourcePriority): number {
  return PRIORITY_ORDER[b] - PRIORITY_ORDER[a];
}
