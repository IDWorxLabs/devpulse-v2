/**
 * Rollback requirement engine — derives rollback gates from simulation forecasts.
 * Dry-run foundation only. No execution.
 */

import type { BuilderInput, RollbackRequirement } from './types.js';

export function generateRollbackRequirements(input: BuilderInput): RollbackRequirement[] {
  return input.rollbackForecasts.map((forecast, index) => ({
    requirementId: `world2-rollback-req-${(index + 1).toString().padStart(4, '0')}`,
    pointId: forecast.pointId,
    stageType: forecast.stageType,
    description: `Rollback checkpoint: ${forecast.pointType} at ${forecast.stageType}`,
    triggerLikelihood: forecast.triggerLikelihood,
    checkpointRequired: forecast.rollbackReady || forecast.pointType === 'checkpointRequired',
  }));
}

export function rollbackRequirementsKey(requirements: RollbackRequirement[]): string {
  return requirements
    .map((r) => `${r.stageType}|${r.triggerLikelihood}|${r.checkpointRequired}`)
    .join(';');
}
