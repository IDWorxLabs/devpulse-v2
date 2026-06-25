/**
 * Large-Scale Multi-App Validation V1 — failure classification.
 */

import type {
  LargeScaleCategoryMetrics,
  LargeScaleFailureClass,
  LargeScaleFailureDistributionEntry,
} from './large-scale-multi-app-validation-types.js';

export function classifyCategoryFailure(input: {
  metrics: LargeScaleCategoryMetrics;
  requirementPoorlyUnderstood: boolean;
  questioningRequired: boolean;
  verificationIncomplete: boolean;
  aflaPassed: boolean;
  aflaVerdict: string;
}): { failureClass: LargeScaleFailureClass; failureDetail: string | null } {
  if (input.aflaPassed) {
    return { failureClass: 'None', failureDetail: null };
  }

  if (input.requirementPoorlyUnderstood) {
    return {
      failureClass: 'Requirement Failure',
      failureDetail: 'Requirement discovery incomplete or poorly understood',
    };
  }

  if (input.questioningRequired && !input.metrics.generationSuccess) {
    return {
      failureClass: 'Planning Failure',
      failureDetail: 'Planning blocked — insufficient requirement clarity',
    };
  }

  if (!input.metrics.buildSuccess && input.metrics.generationSuccess) {
    return {
      failureClass: 'Generation Failure',
      failureDetail: 'Build or materialization evidence not satisfied',
    };
  }

  if (!input.metrics.blueprintSuccess) {
    return {
      failureClass: 'Blueprint Failure',
      failureDetail: 'Blueprint structure or visual proof incomplete',
    };
  }

  if (!input.metrics.featureRealitySuccess) {
    return {
      failureClass: 'Feature Failure',
      failureDetail: 'Feature reality validation did not pass',
    };
  }

  if (!input.metrics.engineeringSuccess) {
    return {
      failureClass: 'Engineering Failure',
      failureDetail: 'Engineering reality assessment did not pass',
    };
  }

  if (input.verificationIncomplete || !input.metrics.blueprintSuccess) {
    return {
      failureClass: 'Verification Failure',
      failureDetail: 'UVL verification coverage or confidence insufficient',
    };
  }

  return {
    failureClass: 'Founder Failure',
    failureDetail: `AFLA verdict: ${input.aflaVerdict}`,
  };
}

export function buildFailureDistribution(
  results: readonly { failureClass: LargeScaleFailureClass }[],
): readonly LargeScaleFailureDistributionEntry[] {
  const counts = new Map<LargeScaleFailureClass, number>();
  const classes: LargeScaleFailureClass[] = [
    'Requirement Failure',
    'Planning Failure',
    'Generation Failure',
    'Blueprint Failure',
    'Feature Failure',
    'Engineering Failure',
    'Verification Failure',
    'Founder Failure',
    'None',
  ];

  for (const cls of classes) {
    counts.set(cls, 0);
  }

  for (const result of results) {
    counts.set(result.failureClass, (counts.get(result.failureClass) ?? 0) + 1);
  }

  const total = results.length;
  return classes
    .map((failureClass) => ({
      readOnly: true as const,
      failureClass,
      count: counts.get(failureClass) ?? 0,
      percentage: total === 0 ? 0 : Math.round(((counts.get(failureClass) ?? 0) / total) * 100),
    }))
    .filter((entry) => entry.count > 0 || entry.failureClass === 'None');
}
