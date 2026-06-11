/**
 * Clarifying Question Intelligence — bounded in-memory history.
 */

import { MAX_CLARIFYING_HISTORY } from './clarifying-question-bounds.js';
import type { ClarifyingQuestionAssessment } from './clarifying-question-types.js';

const history: ClarifyingQuestionAssessment[] = [];

export function resetClarifyingQuestionHistoryForTests(): void {
  history.length = 0;
}

export function recordClarifyingQuestionAssessment(assessment: ClarifyingQuestionAssessment): void {
  history.push(assessment);
  while (history.length > MAX_CLARIFYING_HISTORY) {
    history.shift();
  }
}

export function getClarifyingQuestionHistorySize(): number {
  return history.length;
}

export function getLatestClarifyingQuestionAssessment(): ClarifyingQuestionAssessment | null {
  return history.at(-1) ?? null;
}
