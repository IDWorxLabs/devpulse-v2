/**
 * Auto-Polish Loop — visual polish analyzer.
 * Consumes Visual QA Engine outputs. Read-only.
 */

import type { AutoPolishInput, VisualPolishAnalysis } from './auto-polish-types.js';
import { VISUAL_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface VisualPolishUpstream {
  overallScore: number;
  hierarchyScore: number;
  spacingScore: number;
  typographyScore: number;
  clutterScore: number;
  priorityFixes: string[];
}

let visualPolishAnalysisCount = 0;

export function analyzeVisualPolish(input: AutoPolishInput, upstream: VisualPolishUpstream): VisualPolishAnalysis {
  const cacheKey = [input.requestId, upstream.overallScore, input.visualHierarchyWeak, input.spacingInconsistent].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === VISUAL_POLISH_PASS) return cached as VisualPolishAnalysis;

  visualPolishAnalysisCount += 1;
  const opportunities = [];

  if (input.visualHierarchyWeak === true || upstream.hierarchyScore < 80) {
    opportunities.push(createPolishOpportunity({
      category: 'VISUAL', title: 'Strengthen visual hierarchy',
      description: 'Primary action and information hierarchy need clearer visual weight',
      impactLevel: upstream.hierarchyScore < 65 ? 'HIGH' : 'MEDIUM',
      founderImpact: 75, userImpact: 70, effortEstimate: 'MEDIUM', urgency: 72,
      sourceAnalyzer: 'visual-polish-analyzer', detectionCode: 'VISUAL_POLISH_OPPORTUNITY',
    }));
  }
  if (input.spacingInconsistent === true || upstream.spacingScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'VISUAL', title: 'Improve spacing rhythm',
      description: 'Spacing consistency gaps reduce professional polish',
      impactLevel: 'MEDIUM', founderImpact: 60, userImpact: 65, effortEstimate: 'LOW', urgency: 58,
      sourceAnalyzer: 'visual-polish-analyzer', detectionCode: 'VISUAL_POLISH_OPPORTUNITY',
    }));
  }
  if (input.typographyWeak === true || upstream.typographyScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'VISUAL', title: 'Refine typography hierarchy',
      description: 'Typography scale and readability need polish before launch',
      impactLevel: 'MEDIUM', founderImpact: 55, userImpact: 70, effortEstimate: 'MEDIUM', urgency: 60,
      sourceAnalyzer: 'visual-polish-analyzer', detectionCode: 'VISUAL_POLISH_OPPORTUNITY',
    }));
  }
  if (input.visualClutter === true || upstream.clutterScore < 75) {
    opportunities.push(createPolishOpportunity({
      category: 'VISUAL', title: 'Reduce visual clutter',
      description: 'Density and noise reduce visual confidence on first use',
      impactLevel: 'HIGH', founderImpact: 70, userImpact: 75, effortEstimate: 'MEDIUM', urgency: 68,
      sourceAnalyzer: 'visual-polish-analyzer', detectionCode: 'VISUAL_POLISH_OPPORTUNITY',
    }));
  }
  for (const fix of upstream.priorityFixes.slice(0, 2)) {
    opportunities.push(createPolishOpportunity({
      category: 'VISUAL', title: 'Visual QA priority fix',
      description: fix, impactLevel: 'MEDIUM', founderImpact: 65, userImpact: 60,
      effortEstimate: 'MEDIUM', urgency: 55, sourceAnalyzer: 'visual-polish-analyzer',
      detectionCode: 'VISUAL_POLISH_OPPORTUNITY',
    }));
  }

  const penalty = opportunities.length * 4;
  const visualPolishScore = clampScore(upstream.overallScore - penalty + (opportunities.length === 0 ? 5 : 0));

  const result: VisualPolishAnalysis = {
    polishScore: visualPolishScore,
    opportunities: boundOpportunities(opportunities),
    passToken: VISUAL_POLISH_PASS,
  };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getVisualPolishAnalysisCount(): number {
  return visualPolishAnalysisCount;
}

export function resetVisualPolishAnalyzerForTests(): void {
  visualPolishAnalysisCount = 0;
}
