/**
 * Universal Build Pipeline Verification V1 — build outcome policy.
 */

import type { BuildOutcome } from './universal-build-pipeline-types.js';

export interface BuildOutcomeInput {
  materialized: boolean;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewOk: boolean;
  previewDegraded: boolean;
  blockedBeforeMaterialization: boolean;
}

export function resolveBuildOutcome(input: BuildOutcomeInput): BuildOutcome {
  if (input.blockedBeforeMaterialization || !input.materialized) {
    return 'BUILD_BLOCKED_BEFORE_MATERIALIZATION';
  }
  if (input.previewOk) {
    return 'BUILD_COMPLETED_WITH_PREVIEW';
  }
  if (input.previewDegraded || (input.npmBuildOk && !input.previewOk)) {
    return 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW';
  }
  if (input.npmInstallOk || input.npmBuildOk) {
    return 'BUILD_COMPLETED_WITH_BUILD_ERRORS';
  }
  return 'BUILD_BLOCKED_BEFORE_MATERIALIZATION';
}

export function isPostGenerationOutcome(outcome: BuildOutcome): boolean {
  return outcome !== 'BUILD_BLOCKED_BEFORE_MATERIALIZATION';
}

export function normalizeFailureStageLabel(stage: string, outcome: BuildOutcome): string {
  if (isPostGenerationOutcome(outcome) && (stage === 'PLANNING' || stage === 'PLANNING_FAILED')) {
    return stage.replace('PLANNING_FAILED', 'MATERIALIZATION');
  }
  return stage;
}
