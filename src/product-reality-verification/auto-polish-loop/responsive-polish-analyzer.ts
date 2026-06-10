/**
 * Auto-Polish Loop — responsive polish analyzer.
 * Consumes Visual QA mobile/desktop and Live Preview responsive signals. Read-only.
 */

import type { AutoPolishInput, ResponsivePolishAnalysis } from './auto-polish-types.js';
import { RESPONSIVE_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface ResponsivePolishUpstream {
  mobileVisualScore: number;
  desktopVisualScore: number;
  responsivePreviewScore: number;
  mobileNavPresent: boolean;
  mobileDrawerPresent: boolean;
}

let responsivePolishAnalysisCount = 0;

export function analyzeResponsivePolish(input: AutoPolishInput, upstream: ResponsivePolishUpstream): ResponsivePolishAnalysis {
  const cacheKey = [input.requestId, upstream.mobileVisualScore, input.mobilePolishWeak, input.tabletPolishWeak].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === RESPONSIVE_POLISH_PASS) return cached as ResponsivePolishAnalysis;

  responsivePolishAnalysisCount += 1;
  const opportunities = [];
  const baseScore = Math.round((upstream.mobileVisualScore + upstream.desktopVisualScore + upstream.responsivePreviewScore) / 3);

  if (input.mobilePolishWeak === true || upstream.mobileVisualScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'RESPONSIVE', title: 'Polish mobile layout',
      description: 'Mobile viewport needs spacing, touch targets, and nav polish',
      impactLevel: upstream.mobileVisualScore < 65 ? 'CRITICAL' : 'HIGH',
      founderImpact: 85, userImpact: 80, effortEstimate: 'HIGH', urgency: 82,
      sourceAnalyzer: 'responsive-polish-analyzer', detectionCode: 'RESPONSIVE_POLISH_OPPORTUNITY',
    }));
  }
  if (input.tabletPolishWeak === true) {
    opportunities.push(createPolishOpportunity({
      category: 'RESPONSIVE', title: 'Add tablet viewport polish',
      description: 'Tablet breakpoint experience needs dedicated layout attention',
      impactLevel: 'MEDIUM', founderImpact: 55, userImpact: 60, effortEstimate: 'MEDIUM', urgency: 50,
      sourceAnalyzer: 'responsive-polish-analyzer', detectionCode: 'RESPONSIVE_POLISH_OPPORTUNITY',
    }));
  }
  if (input.desktopPolishWeak === true || upstream.desktopVisualScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'RESPONSIVE', title: 'Polish desktop workspace',
      description: 'Desktop panel utilization and hierarchy need refinement',
      impactLevel: 'MEDIUM', founderImpact: 65, userImpact: 60, effortEstimate: 'MEDIUM', urgency: 55,
      sourceAnalyzer: 'responsive-polish-analyzer', detectionCode: 'RESPONSIVE_POLISH_OPPORTUNITY',
    }));
  }
  if (!upstream.mobileNavPresent && !upstream.mobileDrawerPresent) {
    opportunities.push(createPolishOpportunity({
      category: 'RESPONSIVE', title: 'Improve mobile navigation discoverability',
      description: 'Mobile nav or drawer signals missing from surface scan',
      impactLevel: 'HIGH', founderImpact: 75, userImpact: 78, effortEstimate: 'MEDIUM', urgency: 72,
      sourceAnalyzer: 'responsive-polish-analyzer', detectionCode: 'RESPONSIVE_POLISH_OPPORTUNITY',
    }));
  }

  const penalty = opportunities.length * 5;
  const polishScore = clampScore(baseScore - penalty);

  const result: ResponsivePolishAnalysis = { polishScore, opportunities: boundOpportunities(opportunities), passToken: RESPONSIVE_POLISH_PASS };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getResponsivePolishAnalysisCount(): number {
  return responsivePolishAnalysisCount;
}

export function resetResponsivePolishAnalyzerForTests(): void {
  responsivePolishAnalysisCount = 0;
}
