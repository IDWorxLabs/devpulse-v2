/**
 * Governance pattern engine — extracts reusable governance patterns.
 * Learning only. No execution.
 */

import type { LearnedPattern, LearningInput } from './types.js';

export function extractGovernancePatterns(input: LearningInput): LearnedPattern[] {
  return input.governanceResults.map((result, index) => ({
    patternId: `gov-pattern-${(index + 1).toString().padStart(4, '0')}`,
    patternType: `GOVERNANCE_${result.result}`,
    description: `Governance pattern: ${result.checkType} — ${result.result}`,
    source: result.checkType,
  }));
}

export function governancePatternsKey(patterns: LearnedPattern[]): string {
  return patterns.map((p) => `${p.patternType}|${p.source}`).join(';');
}
