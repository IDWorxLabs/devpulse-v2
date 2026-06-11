/**
 * Adoption Prediction Authority History — bounded assessment retention.
 */

import { MAX_ADOPTION_HISTORY } from './adoption-prediction-bounds.js';
import type { AdoptionPredictionAssessment } from './adoption-prediction-types.js';

const history: AdoptionPredictionAssessment[] = [];

export function resetAdoptionPredictionHistoryForTests(): void {
  history.length = 0;
}

export function recordAdoptionPredictionAssessment(assessment: AdoptionPredictionAssessment): void {
  history.push(assessment);
  while (history.length > MAX_ADOPTION_HISTORY) {
    history.shift();
  }
}

export function getAdoptionPredictionHistorySize(): number {
  return history.length;
}

export function getLatestAdoptionPredictionAssessment(): AdoptionPredictionAssessment | null {
  return history.at(-1) ?? null;
}
