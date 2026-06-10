/**
 * Auto-Polish Loop — product coherence polish analyzer.
 */

import type { AutoPolishInput, ProductCoherencePolishAnalysis } from './auto-polish-types.js';
import { PRODUCT_COHERENCE_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface ProductCoherencePolishUpstream {
  productIdentityScore: number;
  productCoherenceSignals: number;
  fragmentedTerminologyCount: number;
}

let productCoherencePolishAnalysisCount = 0;

export function analyzeProductCoherencePolish(
  input: AutoPolishInput,
  upstream: ProductCoherencePolishUpstream,
): ProductCoherencePolishAnalysis {
  const cacheKey = [input.requestId, upstream.productIdentityScore, input.productFragmented].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === PRODUCT_COHERENCE_POLISH_PASS) return cached as ProductCoherencePolishAnalysis;

  productCoherencePolishAnalysisCount += 1;
  const opportunities = [];

  if (input.productFragmented === true || upstream.productIdentityScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'PRODUCT_COHERENCE', title: 'Unify product identity language',
      description: 'DevPulse feels like disconnected systems rather than one command center',
      impactLevel: upstream.productIdentityScore < 65 ? 'HIGH' : 'MEDIUM',
      founderImpact: 78, userImpact: 82, effortEstimate: 'HIGH', urgency: 74,
      sourceAnalyzer: 'product-coherence-polish-analyzer', detectionCode: 'PRODUCT_COHERENCE_POLISH_OPPORTUNITY',
    }));
  }
  if (upstream.fragmentedTerminologyCount > 2) {
    opportunities.push(createPolishOpportunity({
      category: 'PRODUCT_COHERENCE', title: 'Reduce fragmented terminology',
      description: 'Duplicate concepts and inconsistent naming confuse users',
      impactLevel: 'MEDIUM', founderImpact: 65, userImpact: 75, effortEstimate: 'MEDIUM', urgency: 60,
      sourceAnalyzer: 'product-coherence-polish-analyzer', detectionCode: 'PRODUCT_COHERENCE_POLISH_OPPORTUNITY',
    }));
  }
  opportunities.push(createPolishOpportunity({
    category: 'PRODUCT_COHERENCE', title: 'Connect disconnected experiences',
    description: 'Panels and workflows should feel like one autonomous AI development platform',
    impactLevel: 'MEDIUM', founderImpact: 70, userImpact: 78, effortEstimate: 'HIGH', urgency: 62,
    sourceAnalyzer: 'product-coherence-polish-analyzer', detectionCode: 'PRODUCT_COHERENCE_POLISH_OPPORTUNITY',
  }));

  const baseScore = clampScore(upstream.productIdentityScore + upstream.productCoherenceSignals * 2);
  const penalty = opportunities.length * 4;
  const polishScore = clampScore(baseScore - penalty);

  const result: ProductCoherencePolishAnalysis = {
    polishScore, opportunities: boundOpportunities(opportunities), passToken: PRODUCT_COHERENCE_POLISH_PASS,
  };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getProductCoherencePolishAnalysisCount(): number {
  return productCoherencePolishAnalysisCount;
}

export function resetProductCoherencePolishAnalyzerForTests(): void {
  productCoherencePolishAnalysisCount = 0;
}
