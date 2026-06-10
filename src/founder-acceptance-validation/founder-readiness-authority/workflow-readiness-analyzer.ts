/**
 * Founder Readiness Authority — workflow readiness analyzer.
 */

import type { FounderReadinessAuthorityInput, WorkflowReadinessAnalysis } from './founder-readiness-types.js';
import { WORKFLOW_READINESS_PASS, clampScore } from './founder-readiness-types.js';
import { boundGaps, createReadinessGap } from './readiness-gap-model.js';
import { getCachedAnalyzerResult, setCachedAnalyzerResult } from './founder-readiness-cache.js';

export interface WorkflowReadinessUpstream {
  founderWorkflowScore: number;
  clarityScore: number;
  continuityScore: number;
  outcomeScore: number;
  workflowGapCount: number;
}

let analyzeCount = 0;

export function analyzeWorkflowReadiness(
  input: FounderReadinessAuthorityInput,
  upstream: WorkflowReadinessUpstream,
): WorkflowReadinessAnalysis {
  const cacheKey = [input.requestId, upstream.founderWorkflowScore, input.workflowNotReady].join('|');
  const cached = getCachedAnalyzerResult(cacheKey);
  if (cached && cached.passToken === WORKFLOW_READINESS_PASS) return cached as WorkflowReadinessAnalysis;

  analyzeCount += 1;
  const gaps = [];
  const analysisCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.founderWorkflowScore + upstream.clarityScore + upstream.continuityScore + upstream.outcomeScore) / 4
      - upstream.workflowGapCount * 3,
  );

  if (input.workflowNotReady === true || baseScore < 72) {
    analysisCodes.push('WORKFLOW_READINESS');
    gaps.push(createReadinessGap({
      title: 'Workflow not ready for founder operation',
      description: 'Workflow completeness, operability, or continuity gaps block founder readiness',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      analysisCode: 'WORKFLOW_READINESS',
      sourceAnalyzer: 'workflow-readiness-analyzer',
      readinessContext: 'WORKFLOW_READINESS',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: WorkflowReadinessAnalysis = {
    analyzerType: 'WORKFLOW_READINESS',
    score,
    analysisCodes,
    gaps: boundGaps(gaps),
    passToken: WORKFLOW_READINESS_PASS,
  };
  setCachedAnalyzerResult(cacheKey, result);
  return result;
}

export function getWorkflowReadinessAnalyzeCount(): number {
  return analyzeCount;
}

export function resetWorkflowReadinessAnalyzerForTests(): void {
  analyzeCount = 0;
}
