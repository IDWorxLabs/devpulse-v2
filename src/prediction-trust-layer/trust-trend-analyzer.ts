/**
 * Prediction Trust Layer — trust trend analyzer.
 */

import type { PredictionTrustInput, TrustTrendAnalysis } from './prediction-trust-types.js';
import { getCachedTrendAnalysis, setCachedTrendAnalysis } from './prediction-trust-cache.js';
import { getTrustRuntimeHistorySize } from '../unified-trust-runtime/index.js';
import { getEvidenceIntelligenceHistorySize } from '../evidence-intelligence/index.js';
import { getRealityVerificationHistorySize } from '../reality-verification-expansion/index.js';
import { getCompletionTruthHistorySize } from '../completion-truth-engine/index.js';

let trendAnalysisCount = 0;

export function analyzeTrustTrend(input: PredictionTrustInput): TrustTrendAnalysis {
  const cacheKey = [
    input.requestId,
    input.trustScore ?? 0,
    ...(input.trustHistorySamples ?? []),
  ].join('|');

  const cached = getCachedTrendAnalysis(cacheKey);
  if (cached) return cached;

  trendAnalysisCount += 1;

  const samples = input.trustHistorySamples ?? [];
  const upstreamHistory = getTrustRuntimeHistorySize()
    + getEvidenceIntelligenceHistorySize()
    + getRealityVerificationHistorySize()
    + getCompletionTruthHistorySize();

  let trendDirection: TrustTrendAnalysis['trendDirection'] = 'STABLE';
  let trendConfidence = 50;
  let volatilityScore = 20;

  if (samples.length >= 2) {
    const first = samples[0];
    const last = samples[samples.length - 1];
    const delta = last - first;
    const variance = samples.reduce((s, v) => s + (v - (samples.reduce((a, b) => a + b, 0) / samples.length)) ** 2, 0) / samples.length;
    volatilityScore = Math.min(100, Math.round(Math.sqrt(variance)));

    if (volatilityScore > 35) trendDirection = 'VOLATILE';
    else if (delta > 10) trendDirection = 'IMPROVING';
    else if (delta < -10) trendDirection = 'DEGRADING';
    else trendDirection = 'STABLE';

    trendConfidence = Math.min(100, 50 + samples.length * 5 + (upstreamHistory > 0 ? 10 : 0));
  } else {
    const trust = input.trustScore ?? 50;
    if (trust >= 75) { trendDirection = 'STABLE'; trendConfidence = 60; }
    else if (trust < 40) { trendDirection = 'DEGRADING'; trendConfidence = 55; volatilityScore = 40; }
    else { trendDirection = 'STABLE'; trendConfidence = 45; }
  }

  const result: TrustTrendAnalysis = { trendDirection, trendConfidence, volatilityScore };
  setCachedTrendAnalysis(cacheKey, result);
  return result;
}

export function getTrendAnalysisCount(): number {
  return trendAnalysisCount;
}

export function resetTrustTrendAnalyzerForTests(): void {
  trendAnalysisCount = 0;
}
