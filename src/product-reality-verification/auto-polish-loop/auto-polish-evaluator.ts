/**
 * Auto-Polish Loop — final evaluation.
 */

import type { AutoPolishAuthority, AutoPolishEvaluation } from './auto-polish-types.js';
import { getCachedAutoPolishEvaluation, setCachedAutoPolishEvaluation } from './auto-polish-cache.js';

let evaluationCount = 0;

const POLISH_VERDICT: Record<AutoPolishEvaluation['autoPolishResult'], string> = {
  PASS: 'No critical polish blockers remain — product polish acceptable for production consideration',
  PASS_WITH_WARNINGS: 'Polish gaps remain — address priority improvements before external launch',
  FAIL: 'Critical polish blockers must be resolved before production quality claim',
};

export function evaluateAutoPolish(authority: AutoPolishAuthority): AutoPolishEvaluation {
  const cacheKey = [authority.authorityId, authority.overallScore, authority.autoPolishResult].join('|');
  const cached = getCachedAutoPolishEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: AutoPolishEvaluation = {
    overallScore: authority.overallScore,
    autoPolishResult: authority.autoPolishResult,
    confidence: authority.confidence,
    polishVerdict: POLISH_VERDICT[authority.autoPolishResult],
    visualPolishScore: authority.visualPolishScore,
    uxPolishScore: authority.uxPolishScore,
    responsivePolishScore: authority.responsivePolishScore,
    previewPolishScore: authority.previewPolishScore,
    discoverabilityScore: authority.discoverabilityScore,
    founderUsabilityScore: authority.founderUsabilityScore,
    trustScore: authority.trustScore,
    intelligenceVisibilityScore: authority.intelligenceVisibilityScore,
    workflowScore: authority.workflowScore,
    productCoherenceScore: authority.productCoherenceScore,
    totalOpportunities: authority.totalOpportunities,
    criticalOpportunities: authority.criticalOpportunities,
  };

  setCachedAutoPolishEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetAutoPolishEvaluationForTests(): void {
  evaluationCount = 0;
}
