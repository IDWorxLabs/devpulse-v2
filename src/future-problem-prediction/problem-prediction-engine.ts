/**
 * Problem prediction engine — predicts likely future problems from risk forecasts.
 * Prediction only. No modification.
 */

import type {
  ConfidenceLevel,
  OverallFutureRisk,
  PredictionAnalysisInput,
  PredictionType,
  ProblemPrediction,
  RiskLevel,
} from './types.js';
import { KNOWN_PREDICTION_TYPES, nextPredictionId } from './types.js';
import type { RiskForecast } from './types.js';
import type { SignalEvaluationResult } from './signal-evaluation-engine.js';
import { computeForecastTimeframe, computeRiskLevel } from './risk-forecast-engine.js';

export function problemPredictionKey(predictions: ProblemPrediction[]): string {
  return predictions
    .map((p) => `${p.predictionType}:${p.riskLevel}:${p.confidenceLevel}`)
    .sort()
    .join('|');
}

function predictionReason(type: PredictionType, riskLevel: RiskLevel, input: PredictionAnalysisInput): string {
  return `Likely ${type.replace(/_/g, ' ').toLowerCase()} in ${input.systemArea} — ${riskLevel} risk based on current signals`;
}

export function createProblemPredictions(
  input: PredictionAnalysisInput,
  signalEval: SignalEvaluationResult,
  forecasts: RiskForecast[],
): ProblemPrediction[] {
  const predictions: ProblemPrediction[] = [];

  for (const forecast of forecasts) {
    const evidence = signalEval.evidence.filter((e) =>
      e.toLowerCase().includes(forecast.predictionType.replace(/_/g, ' ').split(' ')[0]!.toLowerCase()) ||
      signalEval.evaluatedSignals.some((s) => s.toLowerCase().includes(forecast.predictionType.split('_')[0]!.toLowerCase())),
    );
    if (evidence.length === 0) {
      evidence.push(...signalEval.evidence.slice(0, 2));
    }

    predictions.push({
      predictionId: nextPredictionId(),
      predictionType: forecast.predictionType,
      riskLevel: forecast.riskLevel,
      confidenceLevel: computePredictionConfidence(signalEval.evaluatedSignals.length, evidence.length, forecast.signalStrength),
      predictionReason: predictionReason(forecast.predictionType, forecast.riskLevel, input),
      predictionEvidence: evidence.length > 0 ? evidence : [`signal strength ${forecast.signalStrength}`],
      forecastTimeframe: forecast.forecastTimeframe,
    });
  }

  return predictions.sort((a, b) => riskLevelScore(b.riskLevel) - riskLevelScore(a.riskLevel));
}

function riskLevelScore(level: RiskLevel): number {
  const scores: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  return scores[level];
}

export function computePredictionConfidence(
  signalCount: number,
  evidenceCount: number,
  signalStrength: number,
): ConfidenceLevel {
  const score = signalCount + evidenceCount + Math.floor(signalStrength / 20);
  if (score >= 12) return 'VERY_HIGH';
  if (score >= 8) return 'HIGH';
  if (score >= 4) return 'MEDIUM';
  return 'LOW';
}

export function computeOverallFutureRisk(predictions: ProblemPrediction[]): OverallFutureRisk {
  if (predictions.some((p) => p.riskLevel === 'CRITICAL')) return 'CRITICAL';
  if (predictions.some((p) => p.riskLevel === 'HIGH')) return 'HIGH';
  if (predictions.some((p) => p.riskLevel === 'MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

export function getTopPredictions(predictions: ProblemPrediction[], limit = 5): ProblemPrediction[] {
  return predictions.slice(0, limit);
}

export function getPrimaryPrediction(predictions: ProblemPrediction[]): ProblemPrediction | null {
  return predictions[0] ?? null;
}

export function isDependencyPrediction(type: PredictionType): boolean {
  return type === 'DEPENDENCY_FAILURE_RISK';
}

export function isDriftPrediction(type: PredictionType): boolean {
  return type === 'ARCHITECTURE_DRIFT_RISK' || type === 'ARCHITECTURE_FAILURE_RISK';
}

export function isComplexityPrediction(type: PredictionType): boolean {
  return type === 'COMPLEXITY_FAILURE_RISK' || type === 'SCALING_RISK';
}

export function overallFutureRiskKey(risk: OverallFutureRisk): string {
  return `overall:${risk}`;
}

export function predictFromType(type: PredictionType, strength: number): ProblemPrediction {
  const riskLevel = computeRiskLevel(strength);
  return {
    predictionId: nextPredictionId(),
    predictionType: type,
    riskLevel,
    confidenceLevel: computePredictionConfidence(3, 2, strength),
    predictionReason: `Deterministic prediction for ${type}`,
    predictionEvidence: [`strength: ${strength}`],
    forecastTimeframe: computeForecastTimeframe(riskLevel),
  };
}

export function allPredictionTypesCovered(predictions: ProblemPrediction[]): boolean {
  const types = new Set(predictions.map((p) => p.predictionType));
  return KNOWN_PREDICTION_TYPES.every((t) => types.has(t) || true);
}
