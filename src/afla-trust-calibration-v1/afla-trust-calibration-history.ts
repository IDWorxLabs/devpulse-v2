/**
 * AFLA Trust Calibration V1 — bounded calibration history.
 */

import { MAX_AFLA_TRUST_CALIBRATION_HISTORY } from './afla-trust-calibration-bounds.js';
import type {
  AflaTrustCalibrationAssessment,
  AflaTrustCalibrationHistoryEntry,
} from './afla-trust-calibration-types.js';
import { deriveVerdictQuality } from './afla-trust-score.js';

const history: AflaTrustCalibrationHistoryEntry[] = [];
let lastAssessment: AflaTrustCalibrationAssessment | null = null;
let runCounter = 0;

export function resetAflaTrustCalibrationHistoryForTests(): void {
  history.length = 0;
  lastAssessment = null;
  runCounter = 0;
}

function toHistoryEntry(assessment: AflaTrustCalibrationAssessment): AflaTrustCalibrationHistoryEntry {
  runCounter += 1;
  return {
    readOnly: true,
    runId: `trust-cal-${runCounter}`,
    profile: assessment.profile,
    productName: assessment.productName,
    aflaTrustScore: assessment.aflaTrustScore,
    verdictQuality: deriveVerdictQuality(assessment.aflaTrustScore),
    falsePositiveCount: assessment.falsePositiveCount,
    falseNegativeCount: assessment.falseNegativeCount,
    timestamp: assessment.generatedAt,
  };
}

export function recordAflaTrustCalibrationAssessment(assessment: AflaTrustCalibrationAssessment): void {
  lastAssessment = assessment;
  history.unshift(toHistoryEntry(assessment));
  if (history.length > MAX_AFLA_TRUST_CALIBRATION_HISTORY) {
    history.length = MAX_AFLA_TRUST_CALIBRATION_HISTORY;
  }
}

export function getLastAflaTrustCalibrationAssessment(): AflaTrustCalibrationAssessment | null {
  return lastAssessment;
}

export function listAflaTrustCalibrationHistory(): readonly AflaTrustCalibrationHistoryEntry[] {
  return history;
}

export function getAflaTrustCalibrationHistorySize(): number {
  return history.length;
}
