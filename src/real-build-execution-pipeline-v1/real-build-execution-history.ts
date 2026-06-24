/**
 * Real Build Execution Pipeline V1 — assessment history.
 */

import type { RealBuildExecutionPipelineAssessment } from './real-build-execution-pipeline-types.js';
import { MAX_REAL_BUILD_EXECUTION_HISTORY } from './real-build-execution-pipeline-bounds.js';

const history: RealBuildExecutionPipelineAssessment[] = [];
let lastAssessment: RealBuildExecutionPipelineAssessment | null = null;

export function recordRealBuildExecutionAssessment(
  assessment: RealBuildExecutionPipelineAssessment,
): void {
  lastAssessment = assessment;
  history.unshift(assessment);
  if (history.length > MAX_REAL_BUILD_EXECUTION_HISTORY) {
    history.length = MAX_REAL_BUILD_EXECUTION_HISTORY;
  }
}

export function getLastRealBuildExecutionAssessment(): RealBuildExecutionPipelineAssessment | null {
  return lastAssessment;
}

export function listRealBuildExecutionHistory(): readonly RealBuildExecutionPipelineAssessment[] {
  return history;
}

export function resetRealBuildExecutionHistoryForTests(): void {
  history.length = 0;
  lastAssessment = null;
}
