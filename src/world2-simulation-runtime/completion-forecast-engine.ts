/**
 * Completion forecast engine — estimates completion likelihood and confidence.
 * Simulation only. No execution.
 */

import type { CompletionCriterion } from '../world2-execution-planner/types.js';
import type { SimulatedRisk, SimulatedStage, SimulatedWarning } from './types.js';
import type { ConfidenceLevel, LikelihoodLevel } from './types.js';
import type { RollbackForecast, VerificationForecast } from './types.js';
import { aggregateRiskLikelihood } from './risk-simulator.js';
import { aggregateRollbackLikelihood } from './rollback-forecast-engine.js';
import { countLikelyFailures } from './verification-forecast-engine.js';

const LIKELIHOOD_WEIGHT: Record<LikelihoodLevel, number> = {
  VERY_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  VERY_HIGH: 5,
};

function weightToCompletionLikelihood(weight: number): LikelihoodLevel {
  if (weight >= 4.5) return 'VERY_HIGH';
  if (weight >= 3.5) return 'HIGH';
  if (weight >= 2.5) return 'MEDIUM';
  if (weight >= 1.5) return 'LOW';
  return 'VERY_LOW';
}

export function forecastCompletionLikelihood(
  stages: SimulatedStage[],
  risks: SimulatedRisk[],
  verificationForecasts: VerificationForecast[],
  rollbackForecasts: RollbackForecast[],
): LikelihoodLevel {
  const blockerCount = stages.filter((s) => s.forecastOutcome === 'LIKELY_BLOCKER').length;
  const delayCount = stages.filter((s) => s.forecastOutcome === 'LIKELY_DELAY').length;
  const riskPressure = LIKELIHOOD_WEIGHT[aggregateRiskLikelihood(risks)];
  const rollbackPressure = LIKELIHOOD_WEIGHT[aggregateRollbackLikelihood(rollbackForecasts)];
  const verificationFailures = countLikelyFailures(verificationForecasts);

  const pressure =
    blockerCount * 2 +
    delayCount * 0.5 +
    riskPressure * 0.4 +
    rollbackPressure * 0.3 +
    verificationFailures * 1.5;

  const successWeight = Math.max(1, 6 - pressure);
  return weightToCompletionLikelihood(successWeight);
}

export function forecastConfidence(
  stages: SimulatedStage[],
  risks: SimulatedRisk[],
  criteria: CompletionCriterion[],
  verificationForecasts: VerificationForecast[],
): ConfidenceLevel {
  const dataPoints =
    stages.length + risks.length + criteria.length + verificationForecasts.length;

  if (dataPoints >= 20) return 'HIGH';
  if (dataPoints >= 10) return 'MEDIUM';
  return 'LOW';
}

export function generateRecommendations(
  stages: SimulatedStage[],
  risks: SimulatedRisk[],
  verificationForecasts: VerificationForecast[],
  completionLikelihood: LikelihoodLevel,
): string[] {
  const recommendations: string[] = [
    'World 2 Simulation Runtime V1 — simulation only. No execution performed.',
  ];

  if (completionLikelihood === 'VERY_LOW' || completionLikelihood === 'LOW') {
    recommendations.push('Review plan risks and verification gates before future execution.');
  }

  if (stages.some((s) => s.forecastOutcome === 'LIKELY_DELAY')) {
    recommendations.push('Add buffer time for stages forecasted as LIKELY_DELAY.');
  }

  if (stages.some((s) => s.forecastOutcome === 'LIKELY_BLOCKER')) {
    recommendations.push('Resolve forecasted blockers before autonomous builder phase.');
  }

  if (risks.some((r) => r.likelihood === 'VERY_HIGH' || r.likelihood === 'HIGH')) {
    recommendations.push('Prioritize high-likelihood risks with explicit mitigation steps.');
  }

  if (verificationForecasts.some((f) => f.forecastResult === 'LIKELY_FAIL')) {
    recommendations.push('Strengthen verification criteria for points forecasted to fail.');
  }

  if (verificationForecasts.some((f) => f.forecastResult === 'LIKELY_PARTIAL')) {
    recommendations.push('Clarify partial verification acceptance criteria before execution.');
  }

  recommendations.push('Confirm governance stack readiness via verification_gated_apply before any builder phase.');

  return recommendations;
}

export function generateSimulatedWarnings(
  stages: SimulatedStage[],
  risks: SimulatedRisk[],
  completionLikelihood: LikelihoodLevel,
): SimulatedWarning[] {
  const warnings: SimulatedWarning[] = [
    {
      warningId: 'sim-warn-0001',
      severity: 'INFO',
      message: 'Simulation only — no execution, file modification, or code generation.',
    },
  ];

  if (completionLikelihood === 'VERY_LOW' || completionLikelihood === 'LOW') {
    warnings.push({
      warningId: 'sim-warn-0002',
      severity: 'ALERT',
      message: 'Low completion likelihood forecast — plan may need revision.',
    });
  }

  if (stages.some((s) => s.forecastOutcome === 'LIKELY_BLOCKER')) {
    warnings.push({
      warningId: 'sim-warn-0003',
      severity: 'WARN',
      message: 'One or more stages forecasted as LIKELY_BLOCKER.',
    });
  }

  if (risks.some((r) => r.forecastLevel === 'CRITICAL')) {
    warnings.push({
      warningId: 'sim-warn-0004',
      severity: 'ALERT',
      message: 'Critical risks present in simulation forecast.',
    });
  }

  return warnings;
}

export function completionForecastKey(
  likelihood: LikelihoodLevel,
  confidence: ConfidenceLevel,
  recommendationCount: number,
): string {
  return `${likelihood}|${confidence}|${recommendationCount}`;
}

export type { SimulatedWarning };
