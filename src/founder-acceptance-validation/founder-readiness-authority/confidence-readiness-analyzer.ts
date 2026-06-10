/**
 * Founder Readiness Authority — confidence readiness analyzer.
 */

import type { FounderReadinessAuthorityInput, ConfidenceReadinessAnalysis } from './founder-readiness-types.js';
import { CONFIDENCE_READINESS_PASS, clampScore } from './founder-readiness-types.js';
import { boundGaps, createReadinessGap } from './readiness-gap-model.js';
import { getCachedAnalyzerResult, setCachedAnalyzerResult } from './founder-readiness-cache.js';

export interface ConfidenceReadinessUpstream {
  founderConfidenceScore: number;
  understandingScore: number;
  reasoningVisibilityScore: number;
  confidenceGapCount: number;
}

let analyzeCount = 0;

export function analyzeConfidenceReadiness(
  input: FounderReadinessAuthorityInput,
  upstream: ConfidenceReadinessUpstream,
): ConfidenceReadinessAnalysis {
  const cacheKey = [input.requestId, upstream.founderConfidenceScore, input.confidenceNotReady].join('|');
  const cached = getCachedAnalyzerResult(cacheKey);
  if (cached && cached.passToken === CONFIDENCE_READINESS_PASS) return cached as ConfidenceReadinessAnalysis;

  analyzeCount += 1;
  const gaps = [];
  const analysisCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.founderConfidenceScore + upstream.understandingScore + upstream.reasoningVisibilityScore) / 3
      - upstream.confidenceGapCount * 3,
  );

  if (input.confidenceNotReady === true || baseScore < 72) {
    analysisCodes.push('CONFIDENCE_READINESS');
    gaps.push(createReadinessGap({
      title: 'Confidence not ready for founder operation',
      description: 'Understanding or reasoning visibility gaps reduce founder readiness',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      analysisCode: 'CONFIDENCE_READINESS',
      sourceAnalyzer: 'confidence-readiness-analyzer',
      readinessContext: 'CONFIDENCE_READINESS',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ConfidenceReadinessAnalysis = {
    analyzerType: 'CONFIDENCE_READINESS',
    score,
    analysisCodes,
    gaps: boundGaps(gaps),
    passToken: CONFIDENCE_READINESS_PASS,
  };
  setCachedAnalyzerResult(cacheKey, result);
  return result;
}

export function getConfidenceReadinessAnalyzeCount(): number {
  return analyzeCount;
}

export function resetConfidenceReadinessAnalyzerForTests(): void {
  analyzeCount = 0;
}
