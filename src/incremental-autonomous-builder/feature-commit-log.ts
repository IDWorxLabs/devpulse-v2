/**
 * Incremental Autonomous Builder — feature commit log.
 */

import type {
  FeatureCommitRecord,
  FeatureSliceGenerationResult,
  FeatureSlicePlan,
  FeatureSliceValidationResult,
} from './incremental-builder-types.js';

let commitCounter = 0;

export function resetFeatureCommitLogForTests(): void {
  commitCounter = 0;
}

const commitLog: FeatureCommitRecord[] = [];

export function recordFeatureCommit(input: {
  slice: FeatureSlicePlan;
  generation: FeatureSliceGenerationResult;
  validation: FeatureSliceValidationResult;
  repairAttempts: number;
  promptFaithfulnessDelta?: number;
  regressionResults?: readonly string[];
}): FeatureCommitRecord {
  commitCounter += 1;
  const record: FeatureCommitRecord = {
    readOnly: true,
    commitId: `commit-${commitCounter}`,
    sliceId: input.slice.sliceId,
    requirementIds: input.slice.requirementIds,
    capabilityIds: input.slice.capabilityIds,
    filesCreated: input.generation.artifacts.map((a) => a.relativePath),
    filesModified: input.generation.artifacts
      .filter((a) => a.artifactKind === 'ROUTE')
      .map((a) => a.relativePath),
    validationResults: input.validation.checks.filter((c) => c.passed).map((c) => c.check),
    repairAttempts: input.repairAttempts,
    promptFaithfulnessDelta: input.promptFaithfulnessDelta ?? 0,
    regressionResults: input.regressionResults ?? ['REGRESSION_GUARD_PASS'],
    timestamp: Date.now(),
    rollbackSnapshotId: input.slice.rollbackBoundary,
  };
  commitLog.push(record);
  return record;
}

export function getFeatureCommitLog(): readonly FeatureCommitRecord[] {
  return commitLog;
}

export function getFeatureCommitLogSize(): number {
  return commitLog.length;
}
