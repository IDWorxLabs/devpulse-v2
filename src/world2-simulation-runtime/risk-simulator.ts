/**
 * Risk simulator — forecasts risk materialization without execution.
 * Simulation only. No file modification or code generation.
 */

import type { RiskItem } from '../world2-execution-planner/types.js';
import type { LikelihoodLevel, SimulatedRisk } from './types.js';

const RISK_LEVEL_TO_LIKELIHOOD: Record<RiskItem['riskLevel'], LikelihoodLevel> = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'VERY_HIGH',
};

export function simulateRisks(risks: RiskItem[]): SimulatedRisk[] {
  return risks.map((risk) => ({
    sourceRiskId: risk.riskId,
    forecastLevel: risk.riskLevel,
    likelihood: RISK_LEVEL_TO_LIKELIHOOD[risk.riskLevel],
    forecastDescription: `Simulated materialization forecast for: ${risk.description}`,
    recommendedMitigation: risk.mitigation,
  }));
}

export function aggregateRiskLikelihood(risks: SimulatedRisk[]): LikelihoodLevel {
  if (risks.length === 0) return 'LOW';

  const weights: Record<LikelihoodLevel, number> = {
    VERY_LOW: 1,
    LOW: 2,
    MEDIUM: 3,
    HIGH: 4,
    VERY_HIGH: 5,
  };

  const avg =
    risks.reduce((sum, r) => sum + weights[r.likelihood], 0) / risks.length;

  if (avg >= 4.5) return 'VERY_HIGH';
  if (avg >= 3.5) return 'HIGH';
  if (avg >= 2.5) return 'MEDIUM';
  if (avg >= 1.5) return 'LOW';
  return 'VERY_LOW';
}

export function riskSimulationKey(risks: SimulatedRisk[]): string {
  return risks
    .map((r) => `${r.forecastLevel}|${r.likelihood}|${r.forecastDescription.length}`)
    .join(';');
}
