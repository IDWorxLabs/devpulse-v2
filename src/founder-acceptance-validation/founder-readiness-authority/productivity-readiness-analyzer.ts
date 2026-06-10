/**
 * Founder Readiness Authority — productivity readiness analyzer.
 */

import type { FounderReadinessAuthorityInput, ProductivityReadinessAnalysis } from './founder-readiness-types.js';
import { PRODUCTIVITY_READINESS_PASS, clampScore } from './founder-readiness-types.js';
import { boundGaps, createReadinessGap } from './readiness-gap-model.js';
import { getCachedAnalyzerResult, setCachedAnalyzerResult } from './founder-readiness-cache.js';

export interface ProductivityReadinessUpstream {
  founderProductivityScore: number;
  throughputScore: number;
  executionEfficiencyScore: number;
  productivityGapCount: number;
}

let analyzeCount = 0;

export function analyzeProductivityReadiness(
  input: FounderReadinessAuthorityInput,
  upstream: ProductivityReadinessUpstream,
): ProductivityReadinessAnalysis {
  const cacheKey = [input.requestId, upstream.founderProductivityScore, input.productivityNotReady].join('|');
  const cached = getCachedAnalyzerResult(cacheKey);
  if (cached && cached.passToken === PRODUCTIVITY_READINESS_PASS) return cached as ProductivityReadinessAnalysis;

  analyzeCount += 1;
  const gaps = [];
  const analysisCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.founderProductivityScore + upstream.throughputScore + upstream.executionEfficiencyScore) / 3
      - upstream.productivityGapCount * 3,
  );

  if (input.productivityNotReady === true || baseScore < 72) {
    analysisCodes.push('PRODUCTIVITY_READINESS');
    gaps.push(createReadinessGap({
      title: 'Productivity not ready for founder operation',
      description: 'Execution or throughput gaps reduce founder operational readiness',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      analysisCode: 'PRODUCTIVITY_READINESS',
      sourceAnalyzer: 'productivity-readiness-analyzer',
      readinessContext: 'PRODUCTIVITY_READINESS',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ProductivityReadinessAnalysis = {
    analyzerType: 'PRODUCTIVITY_READINESS',
    score,
    analysisCodes,
    gaps: boundGaps(gaps),
    passToken: PRODUCTIVITY_READINESS_PASS,
  };
  setCachedAnalyzerResult(cacheKey, result);
  return result;
}

export function getProductivityReadinessAnalyzeCount(): number {
  return analyzeCount;
}

export function resetProductivityReadinessAnalyzerForTests(): void {
  analyzeCount = 0;
}
