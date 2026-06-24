/**
 * Large-Scale Multi-App Validation V1 — bounded run history.
 */

import { MAX_LARGE_SCALE_VALIDATION_HISTORY } from './large-scale-multi-app-validation-bounds.js';
import type {
  LargeScaleMultiAppValidationAssessment,
  LargeScaleValidationHistoryEntry,
} from './large-scale-multi-app-validation-types.js';

const history: LargeScaleValidationHistoryEntry[] = [];
let lastAssessment: LargeScaleMultiAppValidationAssessment | null = null;
let runCounter = 0;

export function resetLargeScaleValidationHistoryForTests(): void {
  history.length = 0;
  lastAssessment = null;
  runCounter = 0;
}

export function recordLargeScaleValidationAssessment(
  assessment: LargeScaleMultiAppValidationAssessment,
): void {
  lastAssessment = assessment;
  runCounter += 1;
  history.unshift({
    readOnly: true,
    runId: `large-scale-run-${runCounter}`,
    categoriesTested: assessment.categoriesTested,
    overallPassRate: assessment.passRates.overallPassRate,
    generalizationScore: assessment.generalizationScore,
    timestamp: assessment.generatedAt,
  });
  if (history.length > MAX_LARGE_SCALE_VALIDATION_HISTORY) {
    history.length = MAX_LARGE_SCALE_VALIDATION_HISTORY;
  }
}

export function getLastLargeScaleValidationAssessment(): LargeScaleMultiAppValidationAssessment | null {
  return lastAssessment;
}

export function listLargeScaleValidationHistory(): readonly LargeScaleValidationHistoryEntry[] {
  return history;
}
