/**
 * Risk forecast engine — creates risk forecasts from evaluated signals.
 * Forecast only. No execution or auto-fix.
 */

import type { ForecastTimeframe, PredictionType, RiskForecast, RiskLevel } from './types.js';
import { nextForecastId, RISK_THRESHOLDS } from './types.js';
import type { SignalEvaluationResult } from './signal-evaluation-engine.js';

export function riskForecastKey(forecasts: RiskForecast[]): string {
  return forecasts
    .map((f) => `${f.predictionType}:${f.riskLevel}:${f.signalStrength}`)
    .sort()
    .join('|');
}

export function computeRiskLevel(strength: number): RiskLevel {
  const clamped = Math.min(100, Math.max(0, Math.round(strength)));
  if (clamped <= RISK_THRESHOLDS.LOW.max) return 'LOW';
  if (clamped <= RISK_THRESHOLDS.MEDIUM.max) return 'MEDIUM';
  if (clamped <= RISK_THRESHOLDS.HIGH.max) return 'HIGH';
  return 'CRITICAL';
}

export function computeForecastTimeframe(riskLevel: RiskLevel): ForecastTimeframe {
  if (riskLevel === 'CRITICAL') return 'IMMEDIATE';
  if (riskLevel === 'HIGH') return 'SHORT_TERM';
  if (riskLevel === 'MEDIUM') return 'MEDIUM_TERM';
  return 'LONG_TERM';
}

function strengthForType(type: PredictionType, value: number): number {
  const base = value * 8;
  const multipliers: Partial<Record<PredictionType, number>> = {
    DEPENDENCY_FAILURE_RISK: 1.1,
    ARCHITECTURE_FAILURE_RISK: 1.2,
    COMPLEXITY_FAILURE_RISK: 1.0,
    GOVERNANCE_FAILURE_RISK: 1.15,
    ARCHITECTURE_DRIFT_RISK: 1.25,
    EXECUTION_AUTHORITY_RISK: 1.3,
    SCALING_RISK: 1.05,
  };
  return Math.min(100, base * (multipliers[type] ?? 1));
}

function forecastReason(type: PredictionType, value: number, riskLevel: RiskLevel): string {
  return `${type.replace(/_/g, ' ').toLowerCase()} forecast at ${riskLevel} level from signal strength ${value}`;
}

export function createRiskForecasts(signalEval: SignalEvaluationResult): RiskForecast[] {
  const forecasts: RiskForecast[] = [];

  for (const [type, value] of Object.entries(signalEval.predictionStrengths)) {
    const predictionType = type as PredictionType;
    const signalStrength = strengthForType(predictionType, value);
    const riskLevel = computeRiskLevel(signalStrength);
    forecasts.push({
      forecastId: nextForecastId(),
      predictionType,
      riskLevel,
      forecastTimeframe: computeForecastTimeframe(riskLevel),
      forecastReason: forecastReason(predictionType, value, riskLevel),
      signalStrength,
    });
  }

  return forecasts.sort((a, b) => b.signalStrength - a.signalStrength);
}

export function isCriticalRiskLevel(level: RiskLevel): boolean {
  return level === 'CRITICAL';
}

export function isHighRiskLevel(level: RiskLevel): boolean {
  return level === 'HIGH' || level === 'CRITICAL';
}

export function isLowRiskLevel(level: RiskLevel): boolean {
  return level === 'LOW';
}

export function isMediumRiskLevel(level: RiskLevel): boolean {
  return level === 'MEDIUM';
}

export function countHighRiskForecasts(forecasts: RiskForecast[]): number {
  return forecasts.filter((f) => f.riskLevel === 'HIGH').length;
}

export function countCriticalRiskForecasts(forecasts: RiskForecast[]): number {
  return forecasts.filter((f) => f.riskLevel === 'CRITICAL').length;
}
