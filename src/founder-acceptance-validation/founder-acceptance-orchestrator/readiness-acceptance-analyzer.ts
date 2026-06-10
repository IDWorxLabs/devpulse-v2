/**
 * Founder Acceptance Orchestrator — readiness acceptance analyzer.
 */

import type {
  FounderAcceptanceOrchestratorInput,
  ReadinessAcceptanceAnalysis,
} from './founder-acceptance-orchestrator-types.js';
import { READINESS_ACCEPTANCE_PASS, clampScore } from './founder-acceptance-orchestrator-types.js';
import { boundGaps, createAcceptanceGap } from './acceptance-gap-model.js';
import { getCachedAnalyzerResult, setCachedAnalyzerResult } from './founder-acceptance-cache.js';

export interface ReadinessAcceptanceUpstream {
  readinessScore: number;
  readinessStatus: string;
  launchBlockerCount: number;
  releaseReadiness: string;
}

let analyzeCount = 0;

export function analyzeReadinessAcceptance(
  input: FounderAcceptanceOrchestratorInput,
  upstream: ReadinessAcceptanceUpstream,
): ReadinessAcceptanceAnalysis {
  const cacheKey = [input.requestId, upstream.readinessScore, upstream.readinessStatus].join('|');
  const cached = getCachedAnalyzerResult(cacheKey);
  if (cached && cached.passToken === READINESS_ACCEPTANCE_PASS) return cached as ReadinessAcceptanceAnalysis;

  analyzeCount += 1;
  const gaps = [];
  const analysisCodes: string[] = [];
  const launchPenalty = upstream.launchBlockerCount > 0 ? 8 : 0;
  const statusPenalty = upstream.readinessStatus === 'FOUNDER_NOT_READY' ? 15
    : upstream.readinessStatus === 'FOUNDER_PARTIALLY_READY' ? 6 : 0;
  const baseScore = Math.round(upstream.readinessScore - launchPenalty - statusPenalty);

  if (input.readinessLow === true || baseScore < 70) {
    analysisCodes.push('READINESS_ACCEPTANCE');
    gaps.push(createAcceptanceGap({
      title: 'Readiness contribution insufficient for acceptance',
      description: 'Launch or adoption readiness gaps reduce founder acceptance likelihood',
      severity: baseScore < 50 ? 'CRITICAL' : 'MAJOR',
      analysisCode: 'READINESS_ACCEPTANCE',
      sourceAnalyzer: 'readiness-acceptance-analyzer',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ReadinessAcceptanceAnalysis = {
    analyzerType: 'READINESS_ACCEPTANCE',
    score,
    analysisCodes,
    gaps: boundGaps(gaps),
    passToken: READINESS_ACCEPTANCE_PASS,
  };
  setCachedAnalyzerResult(cacheKey, result);
  return result;
}

export function getReadinessAcceptanceAnalyzeCount(): number {
  return analyzeCount;
}

export function resetReadinessAcceptanceAnalyzerForTests(): void {
  analyzeCount = 0;
}
