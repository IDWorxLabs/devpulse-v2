/**
 * Success pattern engine — extracts success patterns from project outcomes.
 * Learning only. No execution.
 */

import type { ProjectAnalysis } from './project-analysis-engine.js';
import type { LearnedPattern, LearningInput } from './types.js';

export function extractSuccessPatterns(
  input: LearningInput,
  analysis: ProjectAnalysis,
): LearnedPattern[] {
  const patterns: LearnedPattern[] = [];

  if (input.completionStatus === 'COMPLETE' || input.completionStatus === 'COMPLETE_WITH_WARNINGS') {
    patterns.push({
      patternId: 'success-0001',
      patternType: 'COMPLETION_SUCCESS',
      description: `Project ${input.projectId} achieved ${input.completionStatus}`,
      source: input.verificationId,
    });
  }

  if (analysis.verificationPassCount > 0) {
    patterns.push({
      patternId: 'success-0002',
      patternType: 'VERIFICATION_SUCCESS',
      description: `${analysis.verificationPassCount} verification check(s) passed`,
      source: input.verificationId,
    });
  }

  for (const outcome of input.outcomes) {
    if (outcome.toLowerCase().includes('success') || outcome.toLowerCase().includes('passed')) {
      patterns.push({
        patternId: `success-outcome-${outcome.length}`,
        patternType: 'OUTCOME_SUCCESS',
        description: outcome,
        source: input.planId,
      });
    }
  }

  if (input.governanceResults.every((g) => g.result === 'PASSED')) {
    patterns.push({
      patternId: 'success-0003',
      patternType: 'GOVERNANCE_SUCCESS',
      description: 'All governance checks passed — reusable for future projects',
      source: input.builderId,
    });
  }

  if (input.workspaceIntegrityResults.every((w) => w.result === 'PASSED')) {
    patterns.push({
      patternId: 'success-0004',
      patternType: 'WORKSPACE_INTEGRITY_SUCCESS',
      description: 'Workspace isolation maintained throughout project lifecycle',
      source: input.workspaceId,
    });
  }

  return patterns;
}

export function successPatternsKey(patterns: LearnedPattern[]): string {
  return patterns.map((p) => `${p.patternType}|${p.description.length}`).join(';');
}
