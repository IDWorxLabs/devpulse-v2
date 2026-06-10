/**
 * Founder Acceptance Orchestrator — founder acceptance analyzer.
 */

import type {
  FounderAcceptanceOrchestratorInput,
  FounderAcceptanceAnalysis,
} from './founder-acceptance-orchestrator-types.js';
import { FOUNDER_ACCEPTANCE_PASS, clampScore } from './founder-acceptance-orchestrator-types.js';
import { boundGaps, createAcceptanceGap } from './acceptance-gap-model.js';
import { getCachedAnalyzerResult, setCachedAnalyzerResult } from './founder-acceptance-cache.js';

export interface FounderAcceptanceUpstream {
  workflowScore: number;
  confidenceScore: number;
  trustScore: number;
  workflowResult: string;
  trustResult: string;
}

let analyzeCount = 0;

export function analyzeFounderAcceptance(
  input: FounderAcceptanceOrchestratorInput,
  upstream: FounderAcceptanceUpstream,
): FounderAcceptanceAnalysis {
  const cacheKey = [input.requestId, upstream.workflowScore, upstream.trustScore].join('|');
  const cached = getCachedAnalyzerResult(cacheKey);
  if (cached && cached.passToken === FOUNDER_ACCEPTANCE_PASS) return cached as FounderAcceptanceAnalysis;

  analyzeCount += 1;
  const gaps = [];
  const analysisCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.workflowScore + upstream.confidenceScore + upstream.trustScore) / 3,
  );

  const workflowFail = upstream.workflowResult === 'FAIL' || input.workflowWeak === true;
  const trustFail = upstream.trustResult === 'FAIL' || input.trustWeak === true;

  if (workflowFail || trustFail || baseScore < 72) {
    analysisCodes.push('FOUNDER_ACCEPTANCE');
    gaps.push(createAcceptanceGap({
      title: 'Founder acceptance likelihood reduced',
      description: 'Workflow, trust, or operational acceptance gaps reduce genuine founder acceptance',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      analysisCode: 'FOUNDER_ACCEPTANCE',
      sourceAnalyzer: 'founder-acceptance-analyzer',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: FounderAcceptanceAnalysis = {
    analyzerType: 'FOUNDER_ACCEPTANCE',
    score,
    analysisCodes,
    gaps: boundGaps(gaps),
    passToken: FOUNDER_ACCEPTANCE_PASS,
  };
  setCachedAnalyzerResult(cacheKey, result);
  return result;
}

export function getFounderAcceptanceAnalyzeCount(): number {
  return analyzeCount;
}

export function resetFounderAcceptanceAnalyzerForTests(): void {
  analyzeCount = 0;
}
