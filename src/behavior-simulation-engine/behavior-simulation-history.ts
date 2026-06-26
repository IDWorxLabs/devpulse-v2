/**
 * Behavior Simulation Engine — history.
 */

import { DEFAULT_MAX_BEHAVIOR_SIMULATION_HISTORY } from './behavior-simulation-types.js';
import type { BehaviorSimulationPipelineResult } from './behavior-simulation-types.js';

const history: Array<{ pipelineId: string; verdict: string; completedAt: number }> = [];

export function resetBehaviorSimulationHistoryForTests(): void {
  history.length = 0;
}

export function recordBehaviorSimulationHistory(result: BehaviorSimulationPipelineResult): void {
  history.push({
    pipelineId: result.pipelineId,
    verdict: result.permissionVerdict,
    completedAt: result.completedAt,
  });
  while (history.length > DEFAULT_MAX_BEHAVIOR_SIMULATION_HISTORY) {
    history.shift();
  }
}

export function getBehaviorSimulationHistorySize(): number {
  return history.length;
}
