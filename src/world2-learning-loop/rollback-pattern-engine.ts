/**
 * Rollback pattern engine — extracts reusable rollback patterns.
 * Learning only. No execution.
 */

import type { LearnedPattern, LearningInput } from './types.js';

export function extractRollbackPatterns(input: LearningInput): LearnedPattern[] {
  return input.rollbackResults.map((result, index) => ({
    patternId: `rollback-pattern-${(index + 1).toString().padStart(4, '0')}`,
    patternType: `ROLLBACK_${result.result}`,
    description: `Rollback pattern: ${result.result} for ${result.requirementId}`,
    source: result.requirementId,
  }));
}

export function rollbackPatternsKey(patterns: LearnedPattern[]): string {
  return patterns.map((p) => `${p.patternType}|${p.source}`).join(';');
}
