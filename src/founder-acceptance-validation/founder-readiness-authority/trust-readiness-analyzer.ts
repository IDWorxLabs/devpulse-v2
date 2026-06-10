/**
 * Founder Readiness Authority — trust readiness analyzer.
 */

import type { FounderReadinessAuthorityInput, TrustReadinessAnalysis } from './founder-readiness-types.js';
import { TRUST_READINESS_PASS, clampScore } from './founder-readiness-types.js';
import { boundGaps, createReadinessGap } from './readiness-gap-model.js';
import { getCachedAnalyzerResult, setCachedAnalyzerResult } from './founder-readiness-cache.js';

export interface TrustReadinessUpstream {
  founderTrustScore: number;
  governanceScore: number;
  verificationIntegrityScore: number;
  trustGapCount: number;
}

let analyzeCount = 0;

export function analyzeTrustReadiness(
  input: FounderReadinessAuthorityInput,
  upstream: TrustReadinessUpstream,
): TrustReadinessAnalysis {
  const cacheKey = [input.requestId, upstream.founderTrustScore, input.trustNotReady].join('|');
  const cached = getCachedAnalyzerResult(cacheKey);
  if (cached && cached.passToken === TRUST_READINESS_PASS) return cached as TrustReadinessAnalysis;

  analyzeCount += 1;
  const gaps = [];
  const analysisCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.founderTrustScore + upstream.governanceScore + upstream.verificationIntegrityScore) / 3
      - upstream.trustGapCount * 3,
  );

  if (input.trustNotReady === true || baseScore < 72) {
    analysisCodes.push('TRUST_READINESS');
    gaps.push(createReadinessGap({
      title: 'Trust not ready for founder operation',
      description: 'Governance, verification, or transparency gaps reduce founder readiness',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      analysisCode: 'TRUST_READINESS',
      sourceAnalyzer: 'trust-readiness-analyzer',
      readinessContext: 'TRUST_READINESS',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: TrustReadinessAnalysis = {
    analyzerType: 'TRUST_READINESS',
    score,
    analysisCodes,
    gaps: boundGaps(gaps),
    passToken: TRUST_READINESS_PASS,
  };
  setCachedAnalyzerResult(cacheKey, result);
  return result;
}

export function getTrustReadinessAnalyzeCount(): number {
  return analyzeCount;
}

export function resetTrustReadinessAnalyzerForTests(): void {
  analyzeCount = 0;
}
