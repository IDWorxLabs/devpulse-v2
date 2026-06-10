/**
 * Unified Trust Score — trust score consistency analyzer.
 */

import type { NormalizedTrustScores, TrustConsistencyAnalysis } from './unified-trust-score-types.js';
import { getCachedConsistencyAnalysis, setCachedConsistencyAnalysis } from './unified-trust-score-cache.js';

let consistencyAnalysisCount = 0;

const ALIGNMENT_THRESHOLD = 15;

export function analyzeTrustScoreConsistency(
  normalized: NormalizedTrustScores,
  missingSignals: string[],
): TrustConsistencyAnalysis {
  const cacheKey = [
    normalized.normalizedTrustScore,
    normalized.normalizedEvidenceScore,
    normalized.normalizedRealityScore,
    normalized.normalizedCompletionScore,
    normalized.normalizedPredictionScore,
    missingSignals.join(','),
  ].join('|');

  const cached = getCachedConsistencyAnalysis(cacheKey);
  if (cached) return cached;

  consistencyAnalysisCount += 1;

  const scores = [
    { name: 'trust_runtime', value: normalized.normalizedTrustScore },
    { name: 'evidence_intelligence', value: normalized.normalizedEvidenceScore },
    { name: 'reality_verification', value: normalized.normalizedRealityScore },
    { name: 'completion_truth', value: normalized.normalizedCompletionScore },
    { name: 'prediction_trust', value: normalized.normalizedPredictionScore },
  ];

  const mean = scores.reduce((s, e) => s + e.value, 0) / scores.length;
  const spread = Math.max(...scores.map((s) => s.value)) - Math.min(...scores.map((s) => s.value));

  const alignedSignals: string[] = [];
  const conflictingSignals: string[] = [];
  const unstableSignals: string[] = [];
  const consistencyWarnings: string[] = [];

  for (const score of scores) {
    const delta = Math.abs(score.value - mean);
    if (delta <= ALIGNMENT_THRESHOLD) alignedSignals.push(score.name);
    else if (delta >= ALIGNMENT_THRESHOLD * 2) {
      conflictingSignals.push(score.name);
      consistencyWarnings.push(`${score.name} diverges from mean by ${Math.round(delta)}`);
    } else {
      unstableSignals.push(score.name);
      consistencyWarnings.push(`${score.name} shows moderate instability`);
    }
  }

  if (spread > 35) consistencyWarnings.push('Wide spread across trust domains');
  if (missingSignals.length > 0) consistencyWarnings.push(`Missing signals: ${missingSignals.join(', ')}`);

  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - spread - missingSignals.length * 5)));

  const result: TrustConsistencyAnalysis = {
    consistencyScore,
    consistencyWarnings,
    alignedSignals,
    conflictingSignals,
    missingSignals: [...missingSignals],
    unstableSignals,
  };

  setCachedConsistencyAnalysis(cacheKey, result);
  return result;
}

export function getConsistencyAnalysisCount(): number {
  return consistencyAnalysisCount;
}

export function resetTrustScoreConsistencyAnalyzerForTests(): void {
  consistencyAnalysisCount = 0;
}
