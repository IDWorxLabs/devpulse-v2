/**
 * UVL Maturity V1 — bounded verification history (max 50 runs).
 */

import { MAX_UVL_MATURITY_HISTORY } from './uvl-maturity-bounds.js';
import type { UvlMaturityAssessment, UvlMaturityHistoryEntry } from './uvl-maturity-types.js';

const history: UvlMaturityHistoryEntry[] = [];
let lastAssessment: UvlMaturityAssessment | null = null;
let runCounter = 0;

export function resetUvlMaturityHistoryForTests(): void {
  history.length = 0;
  lastAssessment = null;
  runCounter = 0;
}

function toHistoryEntry(assessment: UvlMaturityAssessment): UvlMaturityHistoryEntry {
  runCounter += 1;
  return {
    readOnly: true,
    runId: `uvl-run-${runCounter}`,
    profile: assessment.profile,
    productName: assessment.productName,
    overallCoveragePercent: assessment.overallCoveragePercent,
    verificationConfidenceScore: assessment.verificationConfidenceScore,
    result: assessment.verificationSufficientForLaunch ? 'SUFFICIENT' : assessment.incompleteVerification ? 'INSUFFICIENT' : 'PARTIAL',
    timestamp: assessment.generatedAt,
  };
}

export function recordUvlMaturityAssessment(assessment: UvlMaturityAssessment): void {
  lastAssessment = assessment;
  history.unshift(toHistoryEntry(assessment));
  if (history.length > MAX_UVL_MATURITY_HISTORY) {
    history.length = MAX_UVL_MATURITY_HISTORY;
  }
}

export function getLastUvlMaturityAssessment(): UvlMaturityAssessment | null {
  return lastAssessment;
}

export function listUvlMaturityHistory(): readonly UvlMaturityHistoryEntry[] {
  return history;
}

export function getUvlMaturityHistorySize(): number {
  return history.length;
}
