/**
 * Prediction Trust Layer — trust volatility analyzer.
 */

import type {
  PredictionTrustInput,
  TrustTrendAnalysis,
  TrustVolatilityAnalysis,
} from './prediction-trust-types.js';
import { getCachedVolatilityAnalysis, setCachedVolatilityAnalysis } from './prediction-trust-cache.js';

let volatilityAnalysisCount = 0;

export function analyzeTrustVolatility(
  input: PredictionTrustInput,
  trend: TrustTrendAnalysis,
): TrustVolatilityAnalysis {
  const cacheKey = [
    trend.volatilityScore,
    input.trustScore ?? 0,
    input.evidenceQuality ?? 0,
    input.realityConfidence ?? 0,
    input.completionTruthScore ?? 0,
  ].join('|');

  const cached = getCachedVolatilityAnalysis(cacheKey);
  if (cached) return cached;

  volatilityAnalysisCount += 1;
  const reasoning: string[] = [];

  const signals = [
    input.trustScore ?? 50,
    input.evidenceQuality ?? 50,
    input.realityConfidence ?? 50,
    input.completionTruthScore ?? 50,
    input.monitoringHealthy === false ? 30 : 70,
  ];
  const mean = signals.reduce((s, v) => s + v, 0) / signals.length;
  const spread = Math.max(...signals) - Math.min(...signals);
  const volatilityScore = Math.min(100, Math.round(trend.volatilityScore + spread * 0.4));
  const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - volatilityScore)));

  if (spread > 30) reasoning.push('Wide spread across trust signals');
  if (trend.trendDirection === 'VOLATILE') reasoning.push('Trust trend is volatile');
  if (input.monitoringHealthy === false) reasoning.push('Monitoring health degraded');
  if (input.governanceStable === false) reasoning.push('Governance instability detected');

  const result: TrustVolatilityAnalysis = {
    volatilityScore,
    stabilityScore,
    volatilityReasoning: reasoning,
  };

  setCachedVolatilityAnalysis(cacheKey, result);
  return result;
}

export function getVolatilityAnalysisCount(): number {
  return volatilityAnalysisCount;
}

export function resetTrustVolatilityAnalyzerForTests(): void {
  volatilityAnalysisCount = 0;
}
