/**
 * Verification forecast engine — estimates verification outcomes without execution.
 * Simulation only. No governance bypass.
 */

import type { VerificationPoint } from '../world2-execution-planner/types.js';
import type { LikelihoodLevel, VerificationForecast, VerificationForecastResult } from './types.js';

function forecastVerificationResult(point: VerificationPoint): VerificationForecastResult {
  if (point.pointType === 'governanceApproved') {
    return 'LIKELY_PASS';
  }
  if (point.pointType === 'dependencyValidated') {
    return 'LIKELY_PARTIAL';
  }
  if (point.pointType === 'requirementsSatisfied') {
    return 'LIKELY_PASS';
  }
  return 'LIKELY_PASS';
}

function resultToLikelihood(result: VerificationForecastResult): LikelihoodLevel {
  if (result === 'LIKELY_PASS') return 'HIGH';
  if (result === 'LIKELY_PARTIAL') return 'MEDIUM';
  return 'LOW';
}

export function forecastVerification(points: VerificationPoint[]): VerificationForecast[] {
  return points.map((point) => {
    const forecastResult = forecastVerificationResult(point);
    return {
      pointId: point.pointId,
      pointType: point.pointType,
      stageType: point.stageType,
      forecastResult,
      likelihood: resultToLikelihood(forecastResult),
      forecastReason: `Simulated verification at ${point.stageType}: ${forecastResult}`,
    };
  });
}

export function countLikelyFailures(forecasts: VerificationForecast[]): number {
  return forecasts.filter((f) => f.forecastResult === 'LIKELY_FAIL').length;
}

export function verificationForecastKey(forecasts: VerificationForecast[]): string {
  return forecasts
    .map((f) => `${f.pointType}|${f.forecastResult}|${f.likelihood}`)
    .join(';');
}
