/**
 * Rollback forecast engine — estimates rollback trigger likelihood without execution.
 * Simulation only. No file modification.
 */

import type { RollbackPoint } from '../world2-execution-planner/types.js';
import type { LikelihoodLevel, RollbackForecast } from './types.js';

const ROLLBACK_TYPE_LIKELIHOOD: Record<RollbackPoint['pointType'], LikelihoodLevel> = {
  checkpointCreated: 'MEDIUM',
  checkpointRecommended: 'LOW',
  checkpointRequired: 'HIGH',
};

export function forecastRollback(points: RollbackPoint[]): RollbackForecast[] {
  return points.map((point) => {
    const triggerLikelihood = ROLLBACK_TYPE_LIKELIHOOD[point.pointType];
    return {
      pointId: point.pointId,
      pointType: point.pointType,
      stageType: point.stageType,
      triggerLikelihood,
      forecastTrigger: `Simulated rollback trigger at ${point.stageType}: ${point.pointType}`,
      rollbackReady: point.pointType !== 'checkpointRecommended',
    };
  });
}

export function aggregateRollbackLikelihood(forecasts: RollbackForecast[]): LikelihoodLevel {
  if (forecasts.length === 0) return 'LOW';

  const weights: Record<LikelihoodLevel, number> = {
    VERY_LOW: 1,
    LOW: 2,
    MEDIUM: 3,
    HIGH: 4,
    VERY_HIGH: 5,
  };

  const avg =
    forecasts.reduce((sum, f) => sum + weights[f.triggerLikelihood], 0) / forecasts.length;

  if (avg >= 4) return 'HIGH';
  if (avg >= 3) return 'MEDIUM';
  if (avg >= 2) return 'LOW';
  return 'VERY_LOW';
}

export function rollbackForecastKey(forecasts: RollbackForecast[]): string {
  return forecasts
    .map((f) => `${f.pointType}|${f.triggerLikelihood}|${f.rollbackReady}`)
    .join(';');
}
