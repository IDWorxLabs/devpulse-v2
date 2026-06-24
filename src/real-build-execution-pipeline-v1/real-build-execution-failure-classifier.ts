/**
 * Real Build Execution Pipeline V1 — failure classification.
 */

import type {
  ExecutionFailureClass,
  RealBuildCategoryMetrics,
} from './real-build-execution-pipeline-types.js';

export function classifyExecutionFailure(input: {
  metrics: RealBuildCategoryMetrics;
  requirementPoorlyUnderstood: boolean;
  npmBuildAttempted: boolean;
  previewAttempted: boolean;
  aflaVerdict: string;
}): { failureClass: ExecutionFailureClass; failureDetail: string | null } {
  if (input.metrics.launchSuccess) {
    return { failureClass: 'None', failureDetail: null };
  }

  if (input.requirementPoorlyUnderstood) {
    return {
      failureClass: 'Requirement Failure',
      failureDetail: 'Requirement discovery incomplete or poorly understood',
    };
  }

  if (!input.metrics.generationSuccess) {
    return {
      failureClass: 'Planning Failure',
      failureDetail: 'Planning or contract readiness blocked code generation',
    };
  }

  if (!input.metrics.materializationSuccess) {
    return {
      failureClass: 'Generation Failure',
      failureDetail: 'Source files were not materialized into workspace',
    };
  }

  if (input.npmBuildAttempted && !input.metrics.buildSuccess) {
    return {
      failureClass: 'Compilation Failure',
      failureDetail: 'npm install or npm run build failed',
    };
  }

  if (input.previewAttempted && !input.metrics.previewSuccess) {
    return {
      failureClass: 'Preview Failure',
      failureDetail: 'Live preview proof missing — HTML shell or feature did not render',
    };
  }

  if (!input.metrics.verificationSuccess) {
    return {
      failureClass: 'Verification Failure',
      failureDetail: 'UVL runtime verification confidence insufficient',
    };
  }

  if (!input.metrics.launchSuccess) {
    return {
      failureClass: 'Founder Failure',
      failureDetail: `AFLA verdict: ${input.aflaVerdict}`,
    };
  }

  return {
    failureClass: 'Runtime Failure',
    failureDetail: 'Runtime or execution proof chain incomplete',
  };
}

export function buildExecutionFailureDistribution(
  results: readonly { failureClass: ExecutionFailureClass }[],
): Array<{ readOnly: true; failureClass: ExecutionFailureClass; count: number; percentage: number }> {
  const classes: ExecutionFailureClass[] = [
    'Requirement Failure',
    'Planning Failure',
    'Generation Failure',
    'Compilation Failure',
    'Runtime Failure',
    'Preview Failure',
    'Verification Failure',
    'Founder Failure',
    'None',
  ];
  const counts = new Map<ExecutionFailureClass, number>();
  for (const cls of classes) counts.set(cls, 0);
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
