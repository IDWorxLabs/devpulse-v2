/**
 * Risk pattern engine — extracts reusable risk patterns.
 * Learning only. No execution.
 */

import type { LearnedPattern, LearningInput } from './types.js';

export function extractRiskPatterns(input: LearningInput): LearnedPattern[] {
  return input.riskControlResults.map((result, index) => ({
    patternId: `risk-pattern-${(index + 1).toString().padStart(4, '0')}`,
    patternType: `RISK_${result.result}`,
    description: `Risk pattern: ${result.result} for ${result.controlId}`,
    source: result.controlId,
  }));
}

export function riskPatternsKey(patterns: LearnedPattern[]): string {
  return patterns.map((p) => `${p.patternType}|${p.source}`).join(';');
}
