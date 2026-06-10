/**
 * Auto-Polish Loop — intelligence visibility polish analyzer.
 * One of the most important analyzers — intelligence exists but may not be visible.
 */

import type { AutoPolishInput, IntelligenceVisibilityPolishAnalysis } from './auto-polish-types.js';
import { INTELLIGENCE_VISIBILITY_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface IntelligenceVisibilityPolishUpstream {
  intelligencePerceptionScore: number;
  intelligenceVisibilityScore: number;
  hiddenIntelligenceRisks: string[];
  operatorFeedPresent: boolean;
  feedStreamPresent: boolean;
}

let intelligenceVisibilityPolishAnalysisCount = 0;

export function analyzeIntelligenceVisibilityPolish(
  input: AutoPolishInput,
  upstream: IntelligenceVisibilityPolishUpstream,
): IntelligenceVisibilityPolishAnalysis {
  const cacheKey = [input.requestId, upstream.intelligencePerceptionScore, input.intelligenceHidden].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === INTELLIGENCE_VISIBILITY_POLISH_PASS) return cached as IntelligenceVisibilityPolishAnalysis;

  intelligenceVisibilityPolishAnalysisCount += 1;
  const opportunities = [];
  const baseScore = Math.round((upstream.intelligencePerceptionScore + upstream.intelligenceVisibilityScore) / 2);

  if (input.intelligenceHidden === true || baseScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'INTELLIGENCE_VISIBILITY',
      title: 'Expose intelligence on first screen',
      description: 'DevPulse intelligence exists internally but is not visible enough to users',
      impactLevel: baseScore < 65 ? 'CRITICAL' : 'HIGH',
      founderImpact: 95, userImpact: 85, effortEstimate: 'MEDIUM', urgency: 92,
      sourceAnalyzer: 'intelligence-visibility-polish-analyzer',
      detectionCode: 'INTELLIGENCE_VISIBILITY_POLISH_OPPORTUNITY',
    }));
  }
  if (!upstream.operatorFeedPresent || !upstream.feedStreamPresent) {
    opportunities.push(createPolishOpportunity({
      category: 'INTELLIGENCE_VISIBILITY',
      title: 'Polish Operator Feed intelligence surface',
      description: 'Reasoning, recommendations, and risks should stream visibly in Operator Feed',
      impactLevel: 'CRITICAL', founderImpact: 90, userImpact: 75, effortEstimate: 'MEDIUM', urgency: 88,
      sourceAnalyzer: 'intelligence-visibility-polish-analyzer',
      detectionCode: 'INTELLIGENCE_VISIBILITY_POLISH_OPPORTUNITY',
    }));
  }
  opportunities.push(createPolishOpportunity({
    category: 'INTELLIGENCE_VISIBILITY',
    title: 'Surface next-step intelligence recommendations',
    description: 'Users should see what DevPulse recommends and will do next',
    impactLevel: 'HIGH', founderImpact: 88, userImpact: 70, effortEstimate: 'MEDIUM', urgency: 80,
    sourceAnalyzer: 'intelligence-visibility-polish-analyzer',
    detectionCode: 'INTELLIGENCE_VISIBILITY_POLISH_OPPORTUNITY',
  }));
  for (const risk of upstream.hiddenIntelligenceRisks.slice(0, 2)) {
    opportunities.push(createPolishOpportunity({
      category: 'INTELLIGENCE_VISIBILITY', title: 'Hidden intelligence risk',
      description: risk, impactLevel: 'HIGH', founderImpact: 85, userImpact: 72,
      effortEstimate: 'MEDIUM', urgency: 78, sourceAnalyzer: 'intelligence-visibility-polish-analyzer',
      detectionCode: 'INTELLIGENCE_VISIBILITY_POLISH_OPPORTUNITY',
    }));
  }

  const penalty = opportunities.length * 5;
  const polishScore = clampScore(baseScore - penalty);

  const result: IntelligenceVisibilityPolishAnalysis = {
    polishScore, opportunities: boundOpportunities(opportunities), passToken: INTELLIGENCE_VISIBILITY_POLISH_PASS,
  };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getIntelligenceVisibilityPolishAnalysisCount(): number {
  return intelligenceVisibilityPolishAnalysisCount;
}

export function resetIntelligenceVisibilityPolishAnalyzerForTests(): void {
  intelligenceVisibilityPolishAnalysisCount = 0;
}
