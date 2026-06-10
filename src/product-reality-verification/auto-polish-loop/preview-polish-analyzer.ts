/**
 * Auto-Polish Loop — preview polish analyzer.
 * Consumes Live Preview Gatekeeper outputs. Read-only.
 */

import type { AutoPolishInput, PreviewPolishAnalysis } from './auto-polish-types.js';
import { PREVIEW_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface PreviewPolishUpstream {
  overallScore: number;
  visibilityScore: number;
  understandabilityScore: number;
  founderVerificationScore: number;
  readinessGaps: string[];
  recommendedFixes: string[];
}

let previewPolishAnalysisCount = 0;

export function analyzePreviewPolish(input: AutoPolishInput, upstream: PreviewPolishUpstream): PreviewPolishAnalysis {
  const cacheKey = [input.requestId, upstream.overallScore, input.previewClarityWeak, input.previewDiscoverabilityWeak].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === PREVIEW_POLISH_PASS) return cached as PreviewPolishAnalysis;

  previewPolishAnalysisCount += 1;
  const opportunities = [];

  if (input.previewClarityWeak === true || upstream.understandabilityScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'PREVIEW', title: 'Clarify preview context',
      description: 'Users cannot easily understand what they are previewing or its limitations',
      impactLevel: 'HIGH', founderImpact: 78, userImpact: 70, effortEstimate: 'MEDIUM', urgency: 74,
      sourceAnalyzer: 'preview-polish-analyzer', detectionCode: 'PREVIEW_POLISH_OPPORTUNITY',
    }));
  }
  if (input.previewDiscoverabilityWeak === true || upstream.visibilityScore < 78) {
    opportunities.push(createPolishOpportunity({
      category: 'PREVIEW', title: 'Improve preview discoverability',
      description: 'Live preview entry and state need stronger visibility',
      impactLevel: 'HIGH', founderImpact: 80, userImpact: 65, effortEstimate: 'MEDIUM', urgency: 76,
      sourceAnalyzer: 'preview-polish-analyzer', detectionCode: 'PREVIEW_POLISH_OPPORTUNITY',
    }));
  }
  if (upstream.founderVerificationScore < 75) {
    opportunities.push(createPolishOpportunity({
      category: 'PREVIEW', title: 'Strengthen founder preview verification',
      description: 'Preview does not sufficiently support founder acceptance workflow',
      impactLevel: 'CRITICAL', founderImpact: 90, userImpact: 55, effortEstimate: 'HIGH', urgency: 88,
      sourceAnalyzer: 'preview-polish-analyzer', detectionCode: 'PREVIEW_POLISH_OPPORTUNITY',
    }));
  }
  for (const gap of upstream.readinessGaps.slice(0, 2)) {
    opportunities.push(createPolishOpportunity({
      category: 'PREVIEW', title: 'Preview readiness gap',
      description: gap, impactLevel: 'MEDIUM', founderImpact: 70, userImpact: 55,
      effortEstimate: 'MEDIUM', urgency: 60, sourceAnalyzer: 'preview-polish-analyzer',
      detectionCode: 'PREVIEW_POLISH_OPPORTUNITY',
    }));
  }

  const penalty = opportunities.length * 4;
  const polishScore = clampScore(upstream.overallScore - penalty);

  const result: PreviewPolishAnalysis = { polishScore, opportunities: boundOpportunities(opportunities), passToken: PREVIEW_POLISH_PASS };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getPreviewPolishAnalysisCount(): number {
  return previewPolishAnalysisCount;
}

export function resetPreviewPolishAnalyzerForTests(): void {
  previewPolishAnalysisCount = 0;
}
