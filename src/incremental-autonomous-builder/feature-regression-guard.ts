/**
 * Incremental Autonomous Builder — regression guard between feature slices.
 */

import type { FeatureRegressionGuardResult } from './incremental-builder-types.js';

let guardCounter = 0;

export function resetFeatureRegressionGuardForTests(): void {
  guardCounter = 0;
}

export function runFeatureRegressionGuard(input: {
  newSliceId: string;
  stableSliceIds: readonly string[];
  simulateBreakSliceId?: string | null;
}): FeatureRegressionGuardResult {
  guardCounter += 1;
  const brokenSliceIds: string[] = [];
  const blockers: string[] = [];

  if (input.simulateBreakSliceId && input.stableSliceIds.includes(input.simulateBreakSliceId)) {
    brokenSliceIds.push(input.simulateBreakSliceId);
    blockers.push(`Regression: new slice ${input.newSliceId} broke ${input.simulateBreakSliceId}`);
  }

  const passed = brokenSliceIds.length === 0;

  return {
    readOnly: true,
    guardId: `regression-${guardCounter}`,
    newSliceId: input.newSliceId,
    passed,
    stableSliceIds: input.stableSliceIds,
    brokenSliceIds,
    responsibleSliceId: passed ? null : input.newSliceId,
    blockers,
  };
}
