/**
 * Founder Workflow Validation — evaluator.
 */

import type {
  FounderWorkflowAuthority,
  FounderWorkflowEvaluation,
  FounderWorkflowResult,
  FounderWorkflowScore,
} from './founder-workflow-types.js';
import { getCachedFounderWorkflowEvaluation, setCachedFounderWorkflowEvaluation } from './founder-workflow-cache.js';

let evaluationCount = 0;

const WORKFLOW_VERDICT: Record<FounderWorkflowResult, string> = {
  PASS: 'DevPulse supports founder operational workflows without critical gaps',
  PASS_WITH_WARNINGS: 'Founder workflows mostly supported — address workflow gaps before daily reliance',
  FAIL: 'Founder operational workflows have critical gaps — not acceptable for founder daily use',
};

export function buildFounderWorkflowScore(authority: FounderWorkflowAuthority): FounderWorkflowScore {
  return {
    overallScore: authority.founderWorkflowScore,
    clarityScore: authority.clarity.score,
    discoverabilityScore: authority.discoverability.score,
    continuityScore: authority.continuity.score,
    frictionScore: authority.friction.score,
    recoveryScore: authority.recovery.score,
    outcomeScore: authority.outcome.score,
    efficiencyScore: authority.efficiency.score,
  };
}

export function evaluateFounderWorkflow(authority: FounderWorkflowAuthority): FounderWorkflowEvaluation {
  const cacheKey = [authority.authorityId, authority.founderWorkflowScore, authority.founderWorkflowResult].join('|');
  const cached = getCachedFounderWorkflowEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;
  const scores = buildFounderWorkflowScore(authority);

  const result: FounderWorkflowEvaluation = {
    overallScore: authority.founderWorkflowScore,
    founderWorkflowResult: authority.founderWorkflowResult,
    confidence: authority.confidence,
    workflowVerdict: WORKFLOW_VERDICT[authority.founderWorkflowResult],
    scores,
    totalGaps: authority.gapAnalysis.gaps.length,
    criticalGaps: authority.gapAnalysis.criticalWorkflowGaps.length,
  };

  setCachedFounderWorkflowEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetFounderWorkflowEvaluatorForTests(): void {
  evaluationCount = 0;
}
