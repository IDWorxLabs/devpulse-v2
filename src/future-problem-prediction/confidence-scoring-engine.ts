/**
 * Confidence scoring engine — scores prediction confidence.
 * Scoring only. No execution.
 */

import type { ConfidenceLevel, ProblemPrediction, RiskForecast } from './types.js';
import { CONFIDENCE_LEVELS } from './types.js';
import { computePredictionConfidence } from './problem-prediction-engine.js';

export function confidenceScoreKey(level: ConfidenceLevel, signalCount: number): string {
  return `${level}|${signalCount}`;
}

export function scorePredictionConfidence(
  predictions: ProblemPrediction[],
  signalCount: number,
  forecasts: RiskForecast[],
): ConfidenceLevel {
  if (predictions.length === 0) return 'LOW';

  const avgStrength =
    forecasts.length > 0
      ? forecasts.reduce((sum, f) => sum + f.signalStrength, 0) / forecasts.length
      : 0;

  const evidenceCount = predictions.reduce((sum, p) => sum + p.predictionEvidence.length, 0);
  return computePredictionConfidence(signalCount, evidenceCount, avgStrength);
}

export function aggregateConfidenceLevels(predictions: ProblemPrediction[]): ConfidenceLevel {
  if (predictions.length === 0) return 'LOW';

  const scores = predictions.map((p) => confidenceToScore(p.confidenceLevel));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return scoreToConfidence(Math.round(avg));
}

function confidenceToScore(level: ConfidenceLevel): number {
  const map: Record<ConfidenceLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 };
  return map[level];
}

function scoreToConfidence(score: number): ConfidenceLevel {
  if (score >= 4) return 'VERY_HIGH';
  if (score >= 3) return 'HIGH';
  if (score >= 2) return 'MEDIUM';
  return 'LOW';
}

export function isVeryHighConfidence(level: ConfidenceLevel): boolean {
  return level === 'VERY_HIGH';
}

export function isHighConfidence(level: ConfidenceLevel): boolean {
  return level === 'HIGH' || level === 'VERY_HIGH';
}

export function allConfidenceLevelsDefined(): boolean {
  return CONFIDENCE_LEVELS.length === 4;
}

export function deterministicConfidence(
  signalCount: number,
  evidenceCount: number,
  strength: number,
): ConfidenceLevel {
  return computePredictionConfidence(signalCount, evidenceCount, strength);
}
