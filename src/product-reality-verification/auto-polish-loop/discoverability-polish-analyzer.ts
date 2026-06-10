/**
 * Auto-Polish Loop — discoverability polish analyzer.
 */

import type { AutoPolishInput, DiscoverabilityPolishAnalysis } from './auto-polish-types.js';
import { DISCOVERABILITY_POLISH_PASS, clampScore } from './auto-polish-types.js';
import { boundOpportunities, createPolishOpportunity } from './polish-opportunity-model.js';
import { getCachedCategoryPolish, setCachedCategoryPolish } from './auto-polish-cache.js';

export interface DiscoverabilityPolishSnapshot {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  world2NavPresent: boolean;
  notificationPresent: boolean;
  projectVaultNavPresent: boolean;
  ideaVaultNavPresent: boolean;
  uvlDiscoverable: boolean;
}

let discoverabilityPolishAnalysisCount = 0;

const FEATURE_CHECKS: Array<{
  key: keyof DiscoverabilityPolishSnapshot;
  title: string;
  inputFlag?: keyof AutoPolishInput;
}> = [
  { key: 'chatPresent', title: 'Chat', inputFlag: 'chatHidden' },
  { key: 'operatorFeedPresent', title: 'Operator Feed', inputFlag: 'operatorFeedHidden' },
  { key: 'world2NavPresent', title: 'World 2', inputFlag: 'world2Hidden' },
  { key: 'notificationPresent', title: 'Notifications' },
  { key: 'projectVaultNavPresent', title: 'Project Vault' },
  { key: 'ideaVaultNavPresent', title: 'Idea Vault' },
  { key: 'uvlDiscoverable', title: 'UVL' },
];

export function analyzeDiscoverabilityPolish(
  input: AutoPolishInput,
  snapshot: DiscoverabilityPolishSnapshot,
): DiscoverabilityPolishAnalysis {
  const cacheKey = [input.requestId, input.chatHidden, input.operatorFeedHidden, input.world2Hidden].join('|');
  const cached = getCachedCategoryPolish(cacheKey);
  if (cached && cached.passToken === DISCOVERABILITY_POLISH_PASS) return cached as DiscoverabilityPolishAnalysis;

  discoverabilityPolishAnalysisCount += 1;
  const opportunities = [];
  let presentCount = 0;

  for (const check of FEATURE_CHECKS) {
    const present = snapshot[check.key];
    const flaggedHidden = check.inputFlag ? input[check.inputFlag] === true : false;
    if (present) presentCount += 1;
    if (!present || flaggedHidden) {
      opportunities.push(createPolishOpportunity({
        category: 'DISCOVERABILITY',
        title: `Improve ${check.title} discoverability`,
        description: `${check.title} is not easily discoverable from the primary product surface`,
        impactLevel: check.title === 'Chat' || check.title === 'Operator Feed' ? 'HIGH' : 'MEDIUM',
        founderImpact: check.title === 'Chat' ? 85 : 60,
        userImpact: 70,
        effortEstimate: 'MEDIUM',
        urgency: check.title === 'Chat' ? 80 : 55,
        sourceAnalyzer: 'discoverability-polish-analyzer',
        detectionCode: 'DISCOVERABILITY_POLISH_OPPORTUNITY',
      }));
    }
  }

  const baseScore = clampScore(60 + presentCount * 6);
  const penalty = opportunities.length * 3;
  const polishScore = clampScore(baseScore - penalty);

  const result: DiscoverabilityPolishAnalysis = {
    polishScore,
    opportunities: boundOpportunities(opportunities),
    passToken: DISCOVERABILITY_POLISH_PASS,
  };
  setCachedCategoryPolish(cacheKey, result);
  return result;
}

export function getDiscoverabilityPolishAnalysisCount(): number {
  return discoverabilityPolishAnalysisCount;
}

export function resetDiscoverabilityPolishAnalyzerForTests(): void {
  discoverabilityPolishAnalysisCount = 0;
}
