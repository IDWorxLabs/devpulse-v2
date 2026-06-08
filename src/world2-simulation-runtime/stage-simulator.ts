/**
 * Stage simulator — forecasts stage outcomes without execution.
 * Simulation only. No file modification or code generation.
 */

import type { ExecutionStage } from '../world2-execution-planner/types.js';
import type { ForecastOutcome, SimulatedStage } from './types.js';

const STAGE_DURATION_BASE: Record<ExecutionStage['stageType'], number> = {
  DISCOVERY: 2,
  ARCHITECTURE: 3,
  IMPLEMENTATION: 5,
  VERIFICATION: 3,
  STABILIZATION: 2,
  COMPLETION: 1,
};

function forecastStageOutcome(stage: ExecutionStage, dependencyCount: number): ForecastOutcome {
  if (stage.stageType === 'IMPLEMENTATION' && dependencyCount >= 2) {
    return 'LIKELY_DELAY';
  }
  if (stage.stageType === 'VERIFICATION') {
    return 'LIKELY_SUCCESS';
  }
  if (stage.dependsOn.length >= 3) {
    return 'LIKELY_DELAY';
  }
  if (stage.stageType === 'DISCOVERY') {
    return 'LIKELY_SUCCESS';
  }
  return 'LIKELY_SUCCESS';
}

export function simulateStages(stages: ExecutionStage[]): SimulatedStage[] {
  return stages.map((stage) => {
    const outcome = forecastStageOutcome(stage, stage.dependsOn.length);
    const duration = STAGE_DURATION_BASE[stage.stageType] + stage.dependsOn.length;

    return {
      stageOrder: stage.stageOrder,
      stageType: stage.stageType,
      stageName: stage.stageName,
      forecastOutcome: outcome,
      estimatedDurationUnits: duration,
      simulationNote: `Simulated ${stage.stageType} — ${outcome} (no execution performed)`,
    };
  });
}

export function stageSimulationKey(stages: SimulatedStage[]): string {
  return stages
    .map((s) => `${s.stageType}|${s.forecastOutcome}|${s.estimatedDurationUnits}`)
    .join(';');
}
