/**
 * Incremental Autonomous Builder — whole-app assembly validation.
 */

import type { FeatureCommitRecord, IncrementalBuildPlan, WholeAppAssemblyResult } from './incremental-builder-types.js';

let assemblyCounter = 0;

export function resetWholeAppAssemblyForTests(): void {
  assemblyCounter = 0;
}

export function assembleWholeApplication(input: {
  plan: IncrementalBuildPlan;
  commitLog: readonly FeatureCommitRecord[];
}): WholeAppAssemblyResult {
  assemblyCounter += 1;
  const stableFeatureCount = input.commitLog.length;
  const requiredCount = input.plan.featureSlices.length;
  const checks = input.plan.wholeAppValidationPlan.map((check) => {
    const passed = stableFeatureCount >= requiredCount;
    return { check, passed, detail: passed ? 'pass' : `Only ${stableFeatureCount}/${requiredCount} features stable` };
  });

  const passed = checks.every((c) => c.passed);

  return {
    readOnly: true,
    assemblyId: `assembly-${assemblyCounter}`,
    passed,
    checks,
    stableFeatureCount,
    blockedReason: passed ? null : 'Whole-app assembly blocked — not all feature slices are stable',
  };
}
