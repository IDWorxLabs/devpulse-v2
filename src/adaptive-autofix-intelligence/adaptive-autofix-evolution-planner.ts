/**
 * Adaptive AutoFix Intelligence — evolution recommendation planner.
 */

import { MAX_EVOLUTION_RECOMMENDATIONS } from './adaptive-autofix-bounds.js';
import { lookupCapabilityMapping } from './adaptive-autofix-capability-detector.js';
import type {
  CapabilityGap,
  EvolutionPriority,
  EvolutionRecommendation,
  FailureRecord,
} from './adaptive-autofix-types.js';

function priorityForFailure(failure: FailureRecord): EvolutionPriority {
  if (failure.failureCategory === 'LAUNCH_FAILURE' || failure.failureCategory === 'VERIFICATION_FAILURE') {
    return 'CRITICAL';
  }
  if (failure.failureCategory === 'TYPECHECK_FAILURE' || failure.failureCategory === 'UI_FAILURE') {
    return 'HIGH';
  }
  if (failure.failureCategory === 'CHAT_FAILURE' || failure.failureCategory === 'PLANNING_FAILURE') {
    return 'MEDIUM';
  }
  return 'LOW';
}

function estimatedReduction(failure: FailureRecord, priority: EvolutionPriority): number {
  const base = Math.min(40, failure.repeatedFailureCount * 8);
  switch (priority) {
    case 'CRITICAL':
      return Math.min(45, base + 15);
    case 'HIGH':
      return Math.min(35, base + 10);
    case 'MEDIUM':
      return Math.min(25, base + 5);
    default:
      return Math.min(15, base);
  }
}

export function planAdaptiveEvolution(input: {
  failures: readonly FailureRecord[];
  gaps: readonly CapabilityGap[];
}): EvolutionRecommendation[] {
  const recommendations: EvolutionRecommendation[] = [];

  for (const failure of input.failures) {
    const gap = input.gaps.find((entry) => entry.failureCategory === failure.failureCategory);
    const mapping = lookupCapabilityMapping(failure.failureCategory);
    if (!gap || !mapping) continue;
    const priority = priorityForFailure(failure);
    recommendations.push({
      missingCapability: gap.missingCapability,
      whyCurrentSystemFailed: `${failure.rootCause} after ${failure.repeatedFailureCount} repeated attempts in ${failure.subsystem}.`,
      expectedBenefit: `Stop repeating failed repair paths and create ${gap.missingCapability} before another fix attempt.`,
      implementationPriority: priority,
      estimatedFailureReduction: estimatedReduction(failure, priority),
      recommendedAuthority: mapping.recommendedAuthority,
      recommendedValidator: mapping.recommendedValidator,
      recommendedIntegrationPoints: [
        'founder-testing-v4-report-builder',
        'launch-council-founder-integration',
        failure.subsystem,
      ],
    });
  }

  const priorityOrder: Record<EvolutionPriority, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return recommendations
    .sort((left, right) => priorityOrder[left.implementationPriority] - priorityOrder[right.implementationPriority])
    .slice(0, MAX_EVOLUTION_RECOMMENDATIONS);
}

export function sumEstimatedFailureReduction(recommendations: readonly EvolutionRecommendation[]): number {
  return Math.min(
    100,
    recommendations.reduce((total, item) => total + item.estimatedFailureReduction, 0),
  );
}
