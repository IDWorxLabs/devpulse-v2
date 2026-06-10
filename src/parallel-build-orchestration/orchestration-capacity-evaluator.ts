/**
 * Parallel Build Orchestration — capacity evaluation.
 */

import type { OrchestrationCapacityEvaluation, OrchestrationProjectInput } from './orchestration-types.js';
import { getRemainingCapacity } from '../resource-allocation/resource-capacity-manager.js';
import { registerAllDefaultResources } from '../resource-allocation/resource-registry.js';

export function evaluateOrchestrationCapacity(
  projects: OrchestrationProjectInput[],
  groupSize = 5,
): OrchestrationCapacityEvaluation {
  registerAllDefaultResources();

  const buildSlots = getRemainingCapacity('BUILD_SLOT');
  const workspaceSlots = getRemainingCapacity('WORKSPACE_SLOT');
  const world2Slots = getRemainingCapacity('WORLD2_SLOT');

  const bottlenecks: string[] = [];
  const safeByBuild = Math.max(1, buildSlots);
  const safeByWorkspace = Math.max(1, workspaceSlots);
  const safeByWorld2 = Math.max(1, world2Slots);

  if (buildSlots < projects.length) {
    bottlenecks.push('BUILD_SLOT capacity limited');
  }
  if (workspaceSlots < projects.length) {
    bottlenecks.push('WORKSPACE_SLOT capacity limited');
  }
  if (world2Slots < Math.ceil(projects.length / groupSize)) {
    bottlenecks.push('WORLD2_SLOT capacity limited');
  }

  const safeLimit = Math.min(safeByBuild, safeByWorkspace, safeByWorld2, groupSize);
  const estimatedParallelism = Math.min(
    projects.length,
    safeLimit,
    Math.max(1, Math.min(buildSlots, workspaceSlots)),
  );

  return {
    estimatedParallelism,
    bottlenecks,
    safeLimit,
  };
}
