/**
 * Risk control engine — derives risk controls from simulation forecasts.
 * Dry-run foundation only. No execution.
 */

import type { BuilderInput, RiskControl } from './types.js';

export function generateRiskControls(input: BuilderInput): RiskControl[] {
  return input.riskForecasts.map((risk, index) => ({
    controlId: `world2-risk-ctrl-${(index + 1).toString().padStart(4, '0')}`,
    sourceRiskId: risk.sourceRiskId,
    controlDescription: `Risk control for ${risk.forecastLevel} risk: ${risk.recommendedMitigation}`,
    likelihood: risk.likelihood,
    mitigationRequired: risk.likelihood === 'HIGH' || risk.likelihood === 'VERY_HIGH',
  }));
}

export function riskControlsKey(controls: RiskControl[]): string {
  return controls
    .map((c) => `${c.likelihood}|${c.mitigationRequired}|${c.controlDescription.length}`)
    .join(';');
}
