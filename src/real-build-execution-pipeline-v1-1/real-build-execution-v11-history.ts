/**
 * Real Build Execution Pipeline V1.1 — assessment history.
 */

import type { RealBuildExecutionPipelineV11Assessment } from './real-build-execution-pipeline-v11-types.js';
import { MAX_REAL_BUILD_EXECUTION_V11_HISTORY } from './real-build-execution-pipeline-v11-bounds.js';

const history: RealBuildExecutionPipelineV11Assessment[] = [];
let lastAssessment: RealBuildExecutionPipelineV11Assessment | null = null;

export function recordRealBuildExecutionV11Assessment(
  assessment: RealBuildExecutionPipelineV11Assessment,
): void {
  lastAssessment = assessment;
  history.unshift(assessment);
  if (history.length > MAX_REAL_BUILD_EXECUTION_V11_HISTORY) {
    history.length = MAX_REAL_BUILD_EXECUTION_V11_HISTORY;
  }
}

export function getLastRealBuildExecutionV11Assessment(): RealBuildExecutionPipelineV11Assessment | null {
  return lastAssessment;
}

export function listRealBuildExecutionV11History(): readonly RealBuildExecutionPipelineV11Assessment[] {
  return history;
}

export function resetRealBuildExecutionV11HistoryForTests(): void {
  history.length = 0;
  lastAssessment = null;
}

export function seedRealBuildExecutionV11HistoryForTests(
  assessment: RealBuildExecutionPipelineV11Assessment,
  count: number,
): void {
  resetRealBuildExecutionV11HistoryForTests();
  for (let i = 0; i < count; i += 1) {
    recordRealBuildExecutionV11Assessment({
      ...assessment,
      generatedAt: new Date().toISOString(),
    });
  }
}
