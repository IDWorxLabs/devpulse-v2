/**
 * Continuous Product Improvement Engine — product quality scoring.
 */

import type {
  ContinuousImprovementPipelineResult,
  ProductQualityScore,
  RankedImprovementOpportunity,
} from './continuous-improvement-types.js';
import { isLaunchBlockingPriority } from './improvement-priority-ranker.js';

export function resetImprovementQualityScorerForTests(): void {
  // stateless scorer
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function calculateProductQualityScore(input: {
  rankedOpportunities: readonly RankedImprovementOpportunity[];
  pipeline: Pick<
    ContinuousImprovementPipelineResult,
    'improvementLoops' | 'deferredOpportunities' | 'blockedOpportunities' | 'improvementAttempts'
  >;
}): ProductQualityScore {
  const applied = input.pipeline.improvementAttempts.filter((a) => a.outcome === 'APPLIED').length;
  const deferred = input.pipeline.deferredOpportunities.length;
  const blocked = input.pipeline.blockedOpportunities.length;

  const unresolvedCritical = input.rankedOpportunities.filter(
    (o) =>
      isLaunchBlockingPriority(o.priority) &&
      !input.pipeline.improvementLoops.some(
        (l) => l.opportunityIds.includes(o.opportunityId) && l.resolved,
      ) &&
      !input.pipeline.deferredOpportunities.some((d) => d.opportunityId === o.opportunityId) &&
      !input.pipeline.blockedOpportunities.some((b) => b.opportunityId === o.opportunityId),
  );

  const launchBlockingIssues: string[] = [];
  for (const opp of unresolvedCritical) {
    launchBlockingIssues.push(`Unresolved ${opp.priority} improvement: ${opp.summary}`);
  }
  for (const b of input.pipeline.blockedOpportunities) {
    if (input.rankedOpportunities.find((o) => o.opportunityId === b.opportunityId && isLaunchBlockingPriority(o.priority))) {
      launchBlockingIssues.push(`Blocked improvement: ${b.reason}`);
    }
  }
  const regression = input.pipeline.improvementAttempts.some((a) => a.outcome === 'ROLLED_BACK');
  if (regression) {
    launchBlockingIssues.push('Improvement introduced regression — rolled back');
  }

  const base = 72;
  const appliedBoost = applied * 4;
  const deferredPenalty = deferred * 1;
  const blockingPenalty = launchBlockingIssues.length * 12;
  const overallScore = clamp(base + appliedBoost - deferredPenalty - blockingPenalty);

  const residualRisk = [
    ...input.pipeline.deferredOpportunities.map((d) => d.reason),
    ...unresolvedCritical.map((o) => `Residual: ${o.summary}`),
  ];

  return {
    readOnly: true,
    overallScore,
    behaviorQuality: clamp(overallScore - 2),
    virtualUserCompletion: clamp(overallScore + (applied > 0 ? 5 : 0)),
    usabilityFriction: clamp(overallScore - deferred),
    deviceReadiness: clamp(overallScore),
    accessibilityQuality: clamp(overallScore + 2),
    performanceQuality: clamp(overallScore),
    securityQuality: clamp(85),
    reliabilityQuality: clamp(overallScore - 1),
    errorHandlingQuality: clamp(overallScore),
    edgeCaseCoverage: clamp(overallScore - 3),
    interactionQuality: clamp(overallScore + 1),
    maintainability: clamp(overallScore - 2),
    scalabilityReadiness: clamp(overallScore - 4),
    launchBlockingIssues,
    safeImprovementsApplied: applied,
    deferredImprovements: deferred,
    residualRisk,
  };
}
