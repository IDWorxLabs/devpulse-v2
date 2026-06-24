/**
 * Cloud Execution Path V1 — assessment history.
 */

import type { CloudExecutionPathV1Assessment } from './cloud-execution-path-v1-types.js';
import { MAX_CLOUD_EXECUTION_HISTORY } from './cloud-execution-path-v1-bounds.js';

const history: CloudExecutionPathV1Assessment[] = [];
let lastAssessment: CloudExecutionPathV1Assessment | null = null;

export function recordCloudExecutionAssessment(
  assessment: CloudExecutionPathV1Assessment,
): void {
  lastAssessment = assessment;
  history.unshift(assessment);
  if (history.length > MAX_CLOUD_EXECUTION_HISTORY) {
    history.length = MAX_CLOUD_EXECUTION_HISTORY;
  }
}

export function getLastCloudExecutionAssessment(): CloudExecutionPathV1Assessment | null {
  return lastAssessment;
}

export function listCloudExecutionHistory(): readonly CloudExecutionPathV1Assessment[] {
  return history;
}

export function resetCloudExecutionHistoryForTests(): void {
  history.length = 0;
  lastAssessment = null;
}

export function seedCloudExecutionHistoryForTests(
  assessment: CloudExecutionPathV1Assessment,
): void {
  recordCloudExecutionAssessment(assessment);
}
