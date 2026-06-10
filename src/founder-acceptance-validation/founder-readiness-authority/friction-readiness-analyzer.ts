/**
 * Founder Readiness Authority — friction readiness analyzer.
 */

import type { FounderReadinessAuthorityInput, FrictionReadinessAnalysis } from './founder-readiness-types.js';
import { FRICTION_READINESS_PASS, clampScore } from './founder-readiness-types.js';
import { boundGaps, createReadinessGap } from './readiness-gap-model.js';
import { getCachedAnalyzerResult, setCachedAnalyzerResult } from './founder-readiness-cache.js';

export interface FrictionReadinessUpstream {
  founderFrictionScore: number;
  criticalFrictionGaps: number;
  majorFrictionGaps: number;
  launchFrictionScore: number;
}

let analyzeCount = 0;

export function analyzeFrictionReadiness(
  input: FounderReadinessAuthorityInput,
  upstream: FrictionReadinessUpstream,
): FrictionReadinessAnalysis {
  const cacheKey = [input.requestId, upstream.founderFrictionScore, input.frictionBlocking].join('|');
  const cached = getCachedAnalyzerResult(cacheKey);
  if (cached && cached.passToken === FRICTION_READINESS_PASS) return cached as FrictionReadinessAnalysis;

  analyzeCount += 1;
  const gaps = [];
  const analysisCodes: string[] = [];
  const frictionPenalty = upstream.criticalFrictionGaps * 10 + upstream.majorFrictionGaps * 4;
  const baseScore = Math.round(
    (upstream.founderFrictionScore + upstream.launchFrictionScore) / 2 - frictionPenalty,
  );

  if (input.frictionBlocking === true || upstream.criticalFrictionGaps > 0 || baseScore < 70) {
    analysisCodes.push('FRICTION_READINESS');
    gaps.push(createReadinessGap({
      title: 'Friction degrades founder readiness',
      description: 'Friction impact and blockers reduce founder ability to operate effectively today',
      severity: upstream.criticalFrictionGaps > 0 || baseScore < 50 ? 'CRITICAL' : 'MAJOR',
      analysisCode: 'FRICTION_READINESS',
      sourceAnalyzer: 'friction-readiness-analyzer',
      readinessContext: 'FRICTION_READINESS',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: FrictionReadinessAnalysis = {
    analyzerType: 'FRICTION_READINESS',
    score,
    analysisCodes,
    gaps: boundGaps(gaps),
    passToken: FRICTION_READINESS_PASS,
  };
  setCachedAnalyzerResult(cacheKey, result);
  return result;
}

export function getFrictionReadinessAnalyzeCount(): number {
  return analyzeCount;
}

export function resetFrictionReadinessAnalyzerForTests(): void {
  analyzeCount = 0;
}
