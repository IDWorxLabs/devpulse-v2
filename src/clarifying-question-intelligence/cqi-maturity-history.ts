/**
 * CQI Maturity V1 — bounded assessment history.
 */

import { MAX_CQI_MATURITY_HISTORY } from './cqi-maturity-bounds.js';
import type { CqiMaturityAssessment } from './cqi-maturity-types.js';

const history: CqiMaturityAssessment[] = [];
let lastAssessment: CqiMaturityAssessment | null = null;

export function resetCqiMaturityHistoryForTests(): void {
  history.length = 0;
  lastAssessment = null;
}

export function recordCqiMaturityAssessment(assessment: CqiMaturityAssessment): void {
  lastAssessment = assessment;
  history.unshift(assessment);
  if (history.length > MAX_CQI_MATURITY_HISTORY) {
    history.length = MAX_CQI_MATURITY_HISTORY;
  }
}

export function getLastCqiMaturityAssessment(): CqiMaturityAssessment | null {
  return lastAssessment;
}

export function listCqiMaturityHistory(): readonly CqiMaturityAssessment[] {
  return history;
}

export function getCqiMaturityHistorySize(): number {
  return history.length;
}
