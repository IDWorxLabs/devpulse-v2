/**
 * Auto-Polish Loop — founder usability polish analyzer.
 */

import type { AutoPolishInput, FounderUsabilityPolishAnalysis } from './auto-polish-types.js';
import { FOUNDER_USABILITY_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface FounderUsabilityPolishUpstream {
  founderUsabilityScore: number;
  founderFrictionNotes: string[];
  nextStepScore: number;
}

let founderUsabilityPolishAnalysisCount = 0;

export function analyzeFounderUsabilityPolish(
  input: AutoPolishInput,
  upstream: FounderUsabilityPolishUpstream,
): FounderUsabilityPolishAnalysis {
  const cacheKey = [input.requestId, upstream.founderUsabilityScore, input.founderFriction].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === FOUNDER_USABILITY_POLISH_PASS) return cached as FounderUsabilityPolishAnalysis;

  founderUsabilityPolishAnalysisCount += 1;
  const opportunities = [];

  if (input.founderFriction === true || upstream.founderUsabilityScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'FOUNDER_USABILITY', title: 'Reduce founder friction',
      description: 'Unnecessary steps and unclear direction slow founder daily use',
      impactLevel: upstream.founderUsabilityScore < 65 ? 'CRITICAL' : 'HIGH',
      founderImpact: 92, userImpact: 50, effortEstimate: 'MEDIUM', urgency: 86,
      sourceAnalyzer: 'founder-usability-polish-analyzer', detectionCode: 'FOUNDER_POLISH_OPPORTUNITY',
    }));
  }
  if (upstream.nextStepScore < 75) {
    opportunities.push(createPolishOpportunity({
      category: 'FOUNDER_USABILITY', title: 'Surface founder next-step shortcuts',
      description: 'Founder cannot quickly see what to do next after key actions',
      impactLevel: 'HIGH', founderImpact: 88, userImpact: 45, effortEstimate: 'LOW', urgency: 80,
      sourceAnalyzer: 'founder-usability-polish-analyzer', detectionCode: 'FOUNDER_POLISH_OPPORTUNITY',
    }));
  }
  opportunities.push(createPolishOpportunity({
    category: 'FOUNDER_USABILITY', title: 'Add founder progress visibility',
    description: 'Progress signals should be visible without reading architecture docs',
    impactLevel: 'MEDIUM', founderImpact: 75, userImpact: 40, effortEstimate: 'MEDIUM', urgency: 65,
    sourceAnalyzer: 'founder-usability-polish-analyzer', detectionCode: 'FOUNDER_POLISH_OPPORTUNITY',
  }));
  for (const note of upstream.founderFrictionNotes.slice(0, 2)) {
    opportunities.push(createPolishOpportunity({
      category: 'FOUNDER_USABILITY', title: 'Founder friction note',
      description: note, impactLevel: 'MEDIUM', founderImpact: 70, userImpact: 40,
      effortEstimate: 'MEDIUM', urgency: 58, sourceAnalyzer: 'founder-usability-polish-analyzer',
      detectionCode: 'FOUNDER_POLISH_OPPORTUNITY',
    }));
  }

  const penalty = opportunities.length * 4;
  const polishScore = clampScore(upstream.founderUsabilityScore - penalty);

  const result: FounderUsabilityPolishAnalysis = {
    polishScore, opportunities: boundOpportunities(opportunities), passToken: FOUNDER_USABILITY_POLISH_PASS,
  };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getFounderUsabilityPolishAnalysisCount(): number {
  return founderUsabilityPolishAnalysisCount;
}

export function resetFounderUsabilityPolishAnalyzerForTests(): void {
  founderUsabilityPolishAnalysisCount = 0;
}
