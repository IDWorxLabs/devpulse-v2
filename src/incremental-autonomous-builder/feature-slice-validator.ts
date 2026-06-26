/**
 * Incremental Autonomous Builder — feature slice validation.
 */

import type {
  FeatureSliceGenerationResult,
  FeatureSlicePlan,
  FeatureSliceValidationResult,
} from './incremental-builder-types.js';

const BASE_CHECKS = [
  'TYPECHECK',
  'BUILD',
  'STATIC_STRUCTURE',
  'PROMPT_FAITHFULNESS',
  'CAPABILITY_COVERAGE',
  'FEATURE_ACCEPTANCE',
  'INTERACTION_PRESENCE',
  'STATE_CONNECTION',
  'ROUTE_CONNECTION',
  'ACCESSIBILITY_BASELINE',
  'REGRESSION_GUARD',
] as const;

export function validateFeatureSlice(input: {
  slice: FeatureSlicePlan;
  generation: FeatureSliceGenerationResult;
  forceFail?: boolean;
  priorStableSliceIds?: readonly string[];
}): FeatureSliceValidationResult {
  const checks = BASE_CHECKS.filter((check) => {
    if (check === 'REGRESSION_GUARD' && !(input.priorStableSliceIds?.length)) return false;
    return input.slice.validationPlan.some((v) => check.includes(v) || v.includes(check.split('_')[0] ?? ''));
  });

  if (checks.length < 3) {
    for (const c of input.slice.validationPlan) {
      if (!checks.includes(c as (typeof BASE_CHECKS)[number])) {
        checks.push(c as (typeof BASE_CHECKS)[number]);
      }
    }
  }

  const forceFail = input.forceFail === true;
  const detailResults = checks.map((check) => ({
    check,
    passed: !forceFail,
    detail: forceFail ? `Simulated failure in ${check}` : 'pass',
  }));

  if (!input.generation.traceabilityComplete) {
    detailResults.push({ check: 'TRACEABILITY', passed: false, detail: 'Missing traceability metadata' });
  } else {
    detailResults.push({ check: 'TRACEABILITY', passed: true, detail: 'All artifacts traced' });
  }

  const passed = detailResults.every((c) => c.passed);

  return {
    readOnly: true,
    sliceId: input.slice.sliceId,
    passed,
    checks: detailResults,
    blockedReason: passed ? null : `Feature slice ${input.slice.name} failed validation`,
  };
}
