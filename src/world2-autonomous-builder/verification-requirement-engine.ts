/**
 * Verification requirement engine — derives verification gates from simulation forecasts.
 * Dry-run foundation only. No execution.
 */

import type { BuilderInput, VerificationRequirement } from './types.js';

export function generateVerificationRequirements(input: BuilderInput): VerificationRequirement[] {
  return input.verificationForecasts.map((forecast, index) => ({
    requirementId: `world2-verify-req-${(index + 1).toString().padStart(4, '0')}`,
    pointId: forecast.pointId,
    stageType: forecast.stageType,
    description: `Verification required: ${forecast.forecastResult} forecast at ${forecast.stageType}`,
    forecastResult: forecast.forecastResult,
    mustPassBeforeExecution: forecast.forecastResult !== 'LIKELY_PASS',
  }));
}

export function verificationRequirementsKey(requirements: VerificationRequirement[]): string {
  return requirements
    .map((r) => `${r.stageType}|${r.forecastResult}|${r.mustPassBeforeExecution}`)
    .join(';');
}
