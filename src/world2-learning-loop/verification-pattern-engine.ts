/**
 * Verification pattern engine — extracts reusable verification patterns.
 * Learning only. No execution.
 */

import type { LearnedPattern, LearningInput } from './types.js';

export function extractVerificationPatterns(input: LearningInput): LearnedPattern[] {
  return input.verificationResults.map((result, index) => ({
    patternId: `verify-pattern-${(index + 1).toString().padStart(4, '0')}`,
    patternType: `VERIFICATION_${result.result}`,
    description: `Verification pattern: ${result.result} at ${result.pointId}`,
    source: result.pointId,
  }));
}

export function verificationPatternsKey(patterns: LearnedPattern[]): string {
  return patterns.map((p) => `${p.patternType}|${p.source}`).join(';');
}
