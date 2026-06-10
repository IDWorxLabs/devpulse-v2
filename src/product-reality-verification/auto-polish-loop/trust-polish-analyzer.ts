/**
 * Auto-Polish Loop — trust polish analyzer.
 */

import type { AutoPolishInput, TrustPolishAnalysis } from './auto-polish-types.js';
import { TRUST_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface TrustPolishUpstream {
  trustworthinessScore: number;
  trustRisks: string[];
  launchReadinessScore: number;
}

let trustPolishAnalysisCount = 0;

export function analyzeTrustPolish(input: AutoPolishInput, upstream: TrustPolishUpstream): TrustPolishAnalysis {
  const cacheKey = [input.requestId, upstream.trustworthinessScore, input.trustGap].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === TRUST_POLISH_PASS) return cached as TrustPolishAnalysis;

  trustPolishAnalysisCount += 1;
  const opportunities = [];

  if (input.trustGap === true || upstream.trustworthinessScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'TRUST', title: 'Strengthen trust signal visibility',
      description: 'Trust signals, honesty, and readiness visibility need polish',
      impactLevel: upstream.trustworthinessScore < 65 ? 'CRITICAL' : 'HIGH',
      founderImpact: 85, userImpact: 80, effortEstimate: 'MEDIUM', urgency: 82,
      sourceAnalyzer: 'trust-polish-analyzer', detectionCode: 'TRUST_POLISH_OPPORTUNITY',
    }));
  }
  if (upstream.launchReadinessScore < 75) {
    opportunities.push(createPolishOpportunity({
      category: 'TRUST', title: 'Improve completion confidence signals',
      description: 'Product readiness perception does not match actual maturity',
      impactLevel: 'HIGH', founderImpact: 78, userImpact: 75, effortEstimate: 'MEDIUM', urgency: 74,
      sourceAnalyzer: 'trust-polish-analyzer', detectionCode: 'TRUST_POLISH_OPPORTUNITY',
    }));
  }
  for (const risk of upstream.trustRisks.slice(0, 2)) {
    opportunities.push(createPolishOpportunity({
      category: 'TRUST', title: 'Trust risk polish',
      description: risk, impactLevel: 'MEDIUM', founderImpact: 72, userImpact: 68,
      effortEstimate: 'LOW', urgency: 62, sourceAnalyzer: 'trust-polish-analyzer',
      detectionCode: 'TRUST_POLISH_OPPORTUNITY',
    }));
  }

  const penalty = opportunities.length * 4;
  const polishScore = clampScore(upstream.trustworthinessScore - penalty);

  const result: TrustPolishAnalysis = { polishScore, opportunities: boundOpportunities(opportunities), passToken: TRUST_POLISH_PASS };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getTrustPolishAnalysisCount(): number {
  return trustPolishAnalysisCount;
}

export function resetTrustPolishAnalyzerForTests(): void {
  trustPolishAnalysisCount = 0;
}
