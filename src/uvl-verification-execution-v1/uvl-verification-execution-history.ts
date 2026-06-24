/**
 * UVL Verification Execution V1 — assessment history.
 */

import type { UvlVerificationExecutionV1Assessment } from './uvl-verification-execution-v1-types.js';
import { MAX_UVL_VERIFICATION_EXECUTION_HISTORY } from './uvl-verification-execution-v1-bounds.js';

const history: UvlVerificationExecutionV1Assessment[] = [];
let lastAssessment: UvlVerificationExecutionV1Assessment | null = null;

export function recordUvlVerificationExecutionAssessment(
  assessment: UvlVerificationExecutionV1Assessment,
): void {
  lastAssessment = assessment;
  history.unshift(assessment);
  if (history.length > MAX_UVL_VERIFICATION_EXECUTION_HISTORY) {
    history.length = MAX_UVL_VERIFICATION_EXECUTION_HISTORY;
  }
}

export function getLastUvlVerificationExecutionAssessment(): UvlVerificationExecutionV1Assessment | null {
  return lastAssessment;
}

export function listUvlVerificationExecutionHistory(): readonly UvlVerificationExecutionV1Assessment[] {
  return history;
}

export function resetUvlVerificationExecutionHistoryForTests(): void {
  history.length = 0;
  lastAssessment = null;
}

export function seedUvlVerificationExecutionHistoryForTests(
  assessment: UvlVerificationExecutionV1Assessment,
  count: number,
): void {
  resetUvlVerificationExecutionHistoryForTests();
  for (let i = 0; i < count; i += 1) {
    recordUvlVerificationExecutionAssessment({
      ...assessment,
      generatedAt: new Date(Date.now() - i * 1000).toISOString(),
    });
  }
}
