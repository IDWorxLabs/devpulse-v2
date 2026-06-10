/**
 * Auto-Polish Loop — UX polish analyzer.
 * Consumes UX Heuristic Evaluator outputs. Read-only.
 */

import type { AutoPolishInput, UXPolishAnalysis } from './auto-polish-types.js';
import { UX_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface UXPolishUpstream {
  overallScore: number;
  navigationScore: number;
  actionClarityScore: number;
  feedbackScore: number;
  founderFrictionRisks: string[];
}

let uxPolishAnalysisCount = 0;

export function analyzeUXPolish(input: AutoPolishInput, upstream: UXPolishUpstream): UXPolishAnalysis {
  const cacheKey = [input.requestId, upstream.overallScore, input.navigationConfusion, input.actionClarityWeak].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === UX_POLISH_PASS) return cached as UXPolishAnalysis;

  uxPolishAnalysisCount += 1;
  const opportunities = [];

  if (input.navigationConfusion === true || upstream.navigationScore < 80) {
    opportunities.push(createPolishOpportunity({
      category: 'UX', title: 'Clarify navigation structure',
      description: 'Navigation clarity improvements needed for daily founder use',
      impactLevel: upstream.navigationScore < 65 ? 'HIGH' : 'MEDIUM',
      founderImpact: 80, userImpact: 75, effortEstimate: 'MEDIUM', urgency: 74,
      sourceAnalyzer: 'ux-polish-analyzer', detectionCode: 'UX_POLISH_OPPORTUNITY',
    }));
  }
  if (input.actionClarityWeak === true || upstream.actionClarityScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'UX', title: 'Sharpen action clarity',
      description: 'Primary and secondary actions need clearer labeling and placement',
      impactLevel: 'HIGH', founderImpact: 72, userImpact: 78, effortEstimate: 'MEDIUM', urgency: 70,
      sourceAnalyzer: 'ux-polish-analyzer', detectionCode: 'UX_POLISH_OPPORTUNITY',
    }));
  }
  if (input.feedbackWeak === true || upstream.feedbackScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'UX', title: 'Improve process feedback',
      description: 'Users need clearer progress and result feedback during workflows',
      impactLevel: 'MEDIUM', founderImpact: 68, userImpact: 72, effortEstimate: 'LOW', urgency: 62,
      sourceAnalyzer: 'ux-polish-analyzer', detectionCode: 'UX_POLISH_OPPORTUNITY',
    }));
  }
  for (const risk of upstream.founderFrictionRisks.slice(0, 2)) {
    opportunities.push(createPolishOpportunity({
      category: 'UX', title: 'UX friction reduction',
      description: risk, impactLevel: 'MEDIUM', founderImpact: 70, userImpact: 65,
      effortEstimate: 'MEDIUM', urgency: 58, sourceAnalyzer: 'ux-polish-analyzer',
      detectionCode: 'UX_POLISH_OPPORTUNITY',
    }));
  }

  const penalty = opportunities.length * 4;
  const polishScore = clampScore(upstream.overallScore - penalty);

  const result: UXPolishAnalysis = { polishScore, opportunities: boundOpportunities(opportunities), passToken: UX_POLISH_PASS };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getUXPolishAnalysisCount(): number {
  return uxPolishAnalysisCount;
}

export function resetUXPolishAnalyzerForTests(): void {
  uxPolishAnalysisCount = 0;
}
