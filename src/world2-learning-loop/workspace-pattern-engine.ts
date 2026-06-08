/**
 * Workspace pattern engine — extracts reusable workspace integrity patterns.
 * Learning only. No execution.
 */

import type { LearnedPattern, LearningInput } from './types.js';

export function extractWorkspacePatterns(input: LearningInput): LearnedPattern[] {
  const integrityPatterns = input.workspaceIntegrityResults.map((result, index) => ({
    patternId: `ws-pattern-${(index + 1).toString().padStart(4, '0')}`,
    patternType: `WORKSPACE_${result.result}`,
    description: `Workspace pattern: ${result.checkType} — ${result.result}`,
    source: result.checkType,
  }));

  const evidencePatterns = input.evidenceResults.map((result, index) => ({
    patternId: `evidence-pattern-${(index + 1).toString().padStart(4, '0')}`,
    patternType: `EVIDENCE_${result.result}`,
    description: `Evidence pattern: ${result.evidenceId} — ${result.result}`,
    source: result.evidenceId,
  }));

  return [...integrityPatterns, ...evidencePatterns];
}

export function workspacePatternsKey(patterns: LearnedPattern[]): string {
  return patterns.map((p) => `${p.patternType}|${p.source}`).join(';');
}
