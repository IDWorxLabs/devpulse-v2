/**
 * Rollback snapshot analyzer — records required snapshot strategy without creating snapshots.
 */

import type { ControlledApplyPlan } from '../world2-controlled-apply-runtime/types.js';
import type { SnapshotRequirement } from './types.js';

export function analyzeSnapshotRequirements(applyPlan: ControlledApplyPlan | null): SnapshotRequirement[] {
  if (!applyPlan) return [];

  const requirements: SnapshotRequirement[] = [
    'PRE_APPLY_WORKSPACE_SNAPSHOT',
    'PRE_APPLY_FILE_MANIFEST',
    'PRE_APPLY_DIFF_MANIFEST',
  ];

  const hasFileSteps = applyPlan.applySteps.some(
    (s) =>
      s.title.toLowerCase().includes('file') ||
      s.title.toLowerCase().includes('modify') ||
      s.title.toLowerCase().includes('create'),
  );
  const hasTestSteps = applyPlan.applySteps.some(
    (s) => s.title.toLowerCase().includes('test') || s.targetArea.includes('testing'),
  );
  const hasDependencySteps = applyPlan.applySteps.some(
    (s) => s.targetArea.includes('dependency') || s.title.toLowerCase().includes('dependency'),
  );

  if (hasFileSteps) {
    requirements.push('PRE_APPLY_GIT_REFERENCE');
  }
  if (hasTestSteps) {
    requirements.push('PRE_APPLY_TEST_BASELINE');
  }
  if (hasDependencySteps) {
    requirements.push('PRE_APPLY_DEPENDENCY_STATE');
  }

  return [...new Set(requirements)];
}

export function snapshotRequirementsIdentified(requirements: SnapshotRequirement[]): boolean {
  return requirements.length >= 3;
}
