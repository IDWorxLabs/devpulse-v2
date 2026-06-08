/**
 * Recommendation pattern engine — extracts recommendation patterns.
 * Learning only. No execution.
 */

import type { LearnedPattern, LearningInput } from './types.js';

export function extractRecommendationPatterns(input: LearningInput): LearnedPattern[] {
  return input.recommendations.map((rec, index) => ({
    patternId: `rec-pattern-${(index + 1).toString().padStart(4, '0')}`,
    patternType: 'RECOMMENDATION',
    description: rec,
    source: input.verificationId,
  }));
}

export function recommendationPatternsKey(patterns: LearnedPattern[]): string {
  return patterns.map((p) => `${p.patternType}|${p.description.length}`).join(';');
}
