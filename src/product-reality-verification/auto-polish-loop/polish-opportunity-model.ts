/**
 * Auto-Polish Loop — unified polish opportunity model.
 */

import type { ImpactLevel, PolishCategory, PolishOpportunity, PolishPriority } from './auto-polish-types.js';

const MAX_PER_ANALYZER = 8;
let opportunityCounter = 0;

export function resetPolishOpportunityCounterForTests(): void {
  opportunityCounter = 0;
}

export function impactToPriority(impact: ImpactLevel): PolishPriority {
  switch (impact) {
    case 'CRITICAL': return 1;
    case 'HIGH': return 2;
    case 'MEDIUM': return 3;
    default: return 4;
  }
}

export function createPolishOpportunity(params: {
  category: PolishCategory;
  title: string;
  description: string;
  impactLevel: ImpactLevel;
  founderImpact: number;
  userImpact: number;
  effortEstimate: 'LOW' | 'MEDIUM' | 'HIGH';
  urgency: number;
  sourceAnalyzer: string;
  detectionCode: string;
}): PolishOpportunity {
  opportunityCounter += 1;
  const recommendedPriority = impactToPriority(params.impactLevel);
  return {
    opportunityId: `polish-opportunity-${opportunityCounter}`,
    category: params.category,
    title: params.title,
    description: params.description,
    impactLevel: params.impactLevel,
    founderImpact: Math.max(0, Math.min(100, params.founderImpact)),
    userImpact: Math.max(0, Math.min(100, params.userImpact)),
    effortEstimate: params.effortEstimate,
    urgency: Math.max(0, Math.min(100, params.urgency)),
    sourceAnalyzer: params.sourceAnalyzer,
    recommendedPriority,
    detectionCode: params.detectionCode,
  };
}

export function boundOpportunities(opportunities: PolishOpportunity[], max = MAX_PER_ANALYZER): PolishOpportunity[] {
  return opportunities.slice(0, max);
}

export function mergeBoundedOpportunities(
  lists: PolishOpportunity[][],
  maxTotal: number,
): PolishOpportunity[] {
  const merged: PolishOpportunity[] = [];
  for (const list of lists) {
    for (const opp of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(opp);
    }
  }
  return merged;
}

export function countCriticalOpportunities(opportunities: readonly PolishOpportunity[]): number {
  return opportunities.filter((o) => o.impactLevel === 'CRITICAL').length;
}

export const MAX_OPPORTUNITIES_PER_ANALYZER = MAX_PER_ANALYZER;
