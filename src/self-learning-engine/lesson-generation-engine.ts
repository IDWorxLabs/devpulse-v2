/**
 * Lesson generation engine — generates structured lesson summaries.
 * Recording only. No behavior change.
 */

import type { LearningCategory, LearningConfidence, LearningEventInput } from './types.js';

export interface LessonGenerationResult {
  lessonSummary: string;
  lessonEvidence: string[];
  confidenceScore: LearningConfidence;
}

export function lessonGenerationKey(
  eventType: string,
  category: LearningCategory,
  workspaceId: string,
): string {
  return `${workspaceId}|${eventType}|${category}`;
}

export function computeLearningConfidence(
  input: LearningEventInput,
  evidenceScore: number,
  blocked: boolean,
): LearningConfidence {
  if (blocked) return 'LOW';
  if (input.confidenceInput) return input.confidenceInput;

  let score = evidenceScore;
  if (input.eventOutcome?.trim()) score += 0.15;
  if (input.evidenceRefs && input.evidenceRefs.length >= 2) score += 0.1;
  if (input.governanceStatus === 'PASS') score += 0.1;
  if (input.authStatus === 'AUTHENTICATED') score += 0.05;

  if (input.eventType.includes('FAILED') || input.eventType === 'FAILURE_OUTCOME') {
    score += 0.05;
  }

  if (score >= 0.85) return 'VERY_HIGH';
  if (score >= 0.65) return 'HIGH';
  if (score >= 0.4) return 'MEDIUM';
  return 'LOW';
}

export function confidenceScoreKey(confidence: LearningConfidence, eventType: string): string {
  return `${confidence}|${eventType}`;
}

export function generateLesson(
  input: LearningEventInput,
  category: LearningCategory,
  evaluatedEvidence: string[],
  evidenceScore: number,
  blocked: boolean,
): LessonGenerationResult {
  if (blocked) {
    return {
      lessonSummary: 'Learning blocked — no lesson generated.',
      lessonEvidence: [],
      confidenceScore: 'LOW',
    };
  }

  const confidenceScore = computeLearningConfidence(input, evidenceScore, blocked);
  const lessonEvidence = [...evaluatedEvidence];
  if (input.eventOutcome?.trim()) lessonEvidence.push(`outcome:${input.eventOutcome.trim()}`);

  const prefix = category.replace('_PATTERN', '').toLowerCase();
  const lessonSummary = [
    `[${prefix}] From ${input.sourceSystem}:`,
    input.eventSummary,
    input.eventOutcome ? `Outcome: ${input.eventOutcome}` : null,
    'Recorded for future recommendations only — no automatic behavior change.',
  ]
    .filter(Boolean)
    .join(' ');

  return { lessonSummary, lessonEvidence, confidenceScore };
}
