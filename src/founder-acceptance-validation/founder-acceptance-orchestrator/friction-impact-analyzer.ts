/**
 * Founder Acceptance Orchestrator — friction impact analyzer.
 */

import type {
  FounderAcceptanceOrchestratorInput,
  FrictionAcceptanceImpactAnalysis,
} from './founder-acceptance-orchestrator-types.js';
import { FRICTION_ACCEPTANCE_PASS, clampScore } from './founder-acceptance-orchestrator-types.js';
import { boundGaps, createAcceptanceGap } from './acceptance-gap-model.js';
import { getCachedAnalyzerResult, setCachedAnalyzerResult } from './founder-acceptance-cache.js';

export interface FrictionImpactUpstream {
  frictionScore: number;
  criticalFrictionGaps: number;
  majorFrictionGaps: number;
  frictionResult: string;
}

let analyzeCount = 0;

export function analyzeFrictionAcceptanceImpact(
  input: FounderAcceptanceOrchestratorInput,
  upstream: FrictionImpactUpstream,
): FrictionAcceptanceImpactAnalysis {
  const cacheKey = [input.requestId, upstream.frictionScore, input.frictionExcessive].join('|');
  const cached = getCachedAnalyzerResult(cacheKey);
  if (cached && cached.passToken === FRICTION_ACCEPTANCE_PASS) return cached as FrictionAcceptanceImpactAnalysis;

  analyzeCount += 1;
  const gaps = [];
  const analysisCodes: string[] = [];
  const penalty = upstream.criticalFrictionGaps * 10 + upstream.majorFrictionGaps * 4;
  const baseScore = Math.round(upstream.frictionScore - penalty);

  if (input.frictionExcessive === true || upstream.frictionResult === 'FAIL' || baseScore < 68) {
    analysisCodes.push('FRICTION_ACCEPTANCE_IMPACT');
    gaps.push(createAcceptanceGap({
      title: 'Friction degrades founder acceptance',
      description: 'Friction impact on acceptance, adoption, and readiness reduces genuine founder acceptance',
      severity: upstream.criticalFrictionGaps > 0 || baseScore < 45 ? 'CRITICAL' : 'MAJOR',
      analysisCode: 'FRICTION_ACCEPTANCE_IMPACT',
      sourceAnalyzer: 'friction-impact-analyzer',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: FrictionAcceptanceImpactAnalysis = {
    analyzerType: 'FRICTION_ACCEPTANCE_IMPACT',
    score,
    analysisCodes,
    gaps: boundGaps(gaps),
    passToken: FRICTION_ACCEPTANCE_PASS,
  };
  setCachedAnalyzerResult(cacheKey, result);
  return result;
}

export function getFrictionImpactAnalyzeCount(): number {
  return analyzeCount;
}

export function resetFrictionImpactAnalyzerForTests(): void {
  analyzeCount = 0;
}
