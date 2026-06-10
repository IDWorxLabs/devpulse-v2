/**
 * Evidence Intelligence — evidence quality analyzer.
 */

import type { EvidenceQualityScores, EvidenceRecord } from './evidence-intelligence-types.js';
import { getCachedQualityAnalysis, setCachedQualityAnalysis } from './evidence-intelligence-cache.js';

let qualityAnalysisCount = 0;

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function computeFreshnessScore(record: EvidenceRecord): number {
  if (record.status === 'STALE') return Math.min(record.freshness, 20);
  const age = Date.now() - record.timestamp;
  if (age > STALE_THRESHOLD_MS) return Math.max(0, record.freshness - 40);
  return record.freshness;
}

export function analyzeEvidenceQuality(records: EvidenceRecord[]): EvidenceQualityScores {
  const cacheKey = records.map((r) => `${r.evidenceId}:${r.strength}:${r.trustworthiness}`).join('|');
  const cached = getCachedQualityAnalysis(cacheKey);
  if (cached) return cached;

  qualityAnalysisCount += 1;

  if (records.length === 0) {
    const empty: EvidenceQualityScores = {
      qualityScore: 0,
      strengthScore: 0,
      reliabilityScore: 0,
      freshnessScore: 0,
      consistencyScore: 0,
    };
    setCachedQualityAnalysis(cacheKey, empty);
    return empty;
  }

  const strengthScore = Math.round(records.reduce((s, r) => s + r.strength, 0) / records.length);
  const reliabilityScore = Math.round(records.reduce((s, r) => s + r.reliability, 0) / records.length);
  const freshnessScore = Math.round(
    records.reduce((s, r) => s + computeFreshnessScore(r), 0) / records.length,
  );

  const trustValues = records.map((r) => r.trustworthiness);
  const trustMean = trustValues.reduce((s, v) => s + v, 0) / trustValues.length;
  const trustVariance = trustValues.reduce((s, v) => s + (v - trustMean) ** 2, 0) / trustValues.length;
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(trustVariance))));

  const qualityScore = Math.round(
    (strengthScore + reliabilityScore + freshnessScore + consistencyScore) / 4,
  );

  const result: EvidenceQualityScores = {
    qualityScore,
    strengthScore,
    reliabilityScore,
    freshnessScore,
    consistencyScore,
  };

  setCachedQualityAnalysis(cacheKey, result);
  return result;
}

export function getQualityAnalysisCount(): number {
  return qualityAnalysisCount;
}

export function resetEvidenceQualityAnalyzerForTests(): void {
  qualityAnalysisCount = 0;
}
