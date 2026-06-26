/**
 * Continuous Product Improvement Engine — opportunity prioritization.
 */

import type {
  ImprovementOpportunity,
  ImprovementPriorityLevel,
  RankedImprovementOpportunity,
} from './continuous-improvement-types.js';

export function resetImprovementPriorityRankerForTests(): void {
  // stateless ranker
}

function scoreOpportunity(opp: ImprovementOpportunity): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;

  const severityWeight = { LOW: 10, MEDIUM: 25, HIGH: 40 };
  score += severityWeight[opp.severity];
  factors.push(`severity:${opp.severity}`);

  const impactWeight = { LOW: 5, MEDIUM: 20, HIGH: 35 };
  score += impactWeight[opp.impact];
  factors.push(`impact:${opp.impact}`);

  if (opp.category === 'ACCESSIBILITY_IMPROVEMENT') {
    score += 25;
    factors.push('accessibility-impact');
  }
  if (opp.category === 'USABILITY_IMPROVEMENT' && /emergency/i.test(opp.summary)) {
    score += 30;
    factors.push('emergency-workflow');
  }
  if (opp.category === 'PERFORMANCE_OPTIMIZATION') {
    score += 15;
    factors.push('mobile-performance');
  }

  const effortPenalty = { LOW: 0, MEDIUM: -8, HIGH: -15 };
  score += effortPenalty[opp.effort];
  factors.push(`effort:${opp.effort}`);

  const riskPenalty = { LOW: 0, MEDIUM: -10, HIGH: -25 };
  score += riskPenalty[opp.risk];
  factors.push(`risk:${opp.risk}`);

  if (opp.promptFaithfulnessRisk === 'HIGH') {
    score -= 20;
    factors.push('prompt-faithfulness-risk');
  }

  return { score, factors };
}

function priorityFromScore(score: number, opp: ImprovementOpportunity): ImprovementPriorityLevel {
  if (opp.severity === 'LOW' && opp.impact === 'LOW' && score < 25) return 'DEFERRED';
  if (score >= 70 || (opp.severity === 'HIGH' && opp.impact === 'HIGH')) return 'CRITICAL';
  if (score >= 50 || opp.severity === 'HIGH') return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  if (score >= 15) return 'LOW';
  return 'DEFERRED';
}

export function rankImprovementOpportunities(
  opportunities: readonly ImprovementOpportunity[],
): RankedImprovementOpportunity[] {
  const ranked = opportunities.map((opp) => {
    const { score, factors } = scoreOpportunity(opp);
    return {
      ...opp,
      readOnly: true as const,
      priority: priorityFromScore(score, opp),
      priorityScore: score,
      priorityFactors: factors,
    };
  });

  return ranked.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function isLaunchBlockingPriority(priority: ImprovementPriorityLevel): boolean {
  return priority === 'CRITICAL' || priority === 'HIGH';
}
