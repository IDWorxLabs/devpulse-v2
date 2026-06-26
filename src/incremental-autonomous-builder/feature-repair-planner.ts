/**
 * Incremental Autonomous Builder — targeted feature repair planning.
 */

import type {
  FeatureRepairPlan,
  FeatureSlicePlan,
  FeatureSliceValidationResult,
} from './incremental-builder-types.js';

let repairCounter = 0;

export function resetFeatureRepairPlannerForTests(): void {
  repairCounter = 0;
}

export function planFeatureRepair(input: {
  slice: FeatureSlicePlan;
  validation: FeatureSliceValidationResult;
  attemptNumber: number;
}): FeatureRepairPlan {
  repairCounter += 1;
  const failedChecks = input.validation.checks.filter((c) => !c.passed).map((c) => c.check);
  const slug = input.slice.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    readOnly: true,
    repairId: `repair-${repairCounter}`,
    sliceId: input.slice.sliceId,
    failureClass: failedChecks[0] ?? 'VALIDATION_FAILURE',
    responsibleArtifacts: [
      `src/features/${slug}/${slug}Feature.tsx`,
      `src/features/${slug}/${slug}.service.ts`,
    ],
    targetedPatches: failedChecks.map(
      (check) => `Patch ${slug} to resolve ${check} without modifying unrelated slices`,
    ),
    preserveFaithfulness: true,
    preserveValidatedBehavior: true,
    attemptNumber: input.attemptNumber,
  };
}
