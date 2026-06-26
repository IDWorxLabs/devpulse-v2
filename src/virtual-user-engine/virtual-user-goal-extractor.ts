/**
 * Virtual User Engine — user goal extraction.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { VirtualUserGoal, VirtualUserProfile } from './virtual-user-types.js';

let goalCounter = 0;

export function extractVirtualUserGoals(input: {
  profiles: readonly VirtualUserProfile[];
  incrementalBuild?: IncrementalBuildPipelineResult;
  behaviorSimulation?: BehaviorSimulationPipelineResult;
}): VirtualUserGoal[] {
  const goals: VirtualUserGoal[] = [];

  for (const profile of input.profiles) {
    for (const goalDesc of profile.productGoals) {
      goalCounter += 1;
      const behaviorScenarios = input.behaviorSimulation?.scenarios.filter((s) =>
        goalDesc.toLowerCase().split(' ').some((w) => s.name.toLowerCase().includes(w)),
      ) ?? [];
      const sliceIds = input.incrementalBuild?.buildPlan.featureSlices
        .filter((s) =>
          profile.primaryWorkflows.some((w) => {
            const wNorm = w.toLowerCase();
            const sNorm = s.name.toLowerCase();
            return sNorm.includes(wNorm) || wNorm.includes(sNorm);
          }),
        )
        .map((s) => s.sliceId) ?? [];

      goals.push({
        readOnly: true,
        goalId: `goal-${goalCounter}`,
        userId: profile.userId,
        description: goalDesc,
        sourceRequirements: profile.sourceRequirementIds,
        requiredFeatureSliceIds: sliceIds,
        requiredBehaviorScenarioIds: behaviorScenarios.map((s) => s.scenarioId),
        preconditions: ['Application loaded'],
        completionCriteria: profile.successCriteria.filter((c) =>
          goalDesc.toLowerCase().split(' ').some((w) => c.toLowerCase().includes(w)),
        ).length ? profile.successCriteria : [`${goalDesc} completed`],
        failureCriteria: ['Goal not reached', 'Blocking error occurred'],
        priority: /emergency|communicate|add expense/i.test(goalDesc) ? 'CRITICAL' : 'HIGH',
        risk: profile.riskLevel,
      });
    }
  }

  return goals;
}
