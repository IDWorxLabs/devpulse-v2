/**
 * UI Reviewer Authority — bounded in-memory history.
 */

import { MAX_UI_REVIEWER_HISTORY } from './ui-reviewer-bounds.js';
import type { UIReviewerAssessment } from './ui-reviewer-types.js';

const history: UIReviewerAssessment[] = [];

export function resetUIReviewerHistoryForTests(): void {
  history.length = 0;
}

export function recordUIReviewerAssessment(assessment: UIReviewerAssessment): void {
  history.push(assessment);
  while (history.length > MAX_UI_REVIEWER_HISTORY) {
    history.shift();
  }
}

export function getUIReviewerHistorySize(): number {
  return history.length;
}

export function getLatestUIReviewerAssessment(): UIReviewerAssessment | null {
  return history.at(-1) ?? null;
}
