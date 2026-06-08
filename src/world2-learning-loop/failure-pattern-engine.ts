/**
 * Failure pattern engine — extracts failure patterns from project outcomes.
 * Learning only. No execution.
 */

import type { ProjectAnalysis } from './project-analysis-engine.js';
import type { LearnedPattern, LearningInput } from './types.js';

export function extractFailurePatterns(
  input: LearningInput,
  analysis: ProjectAnalysis,
): LearnedPattern[] {
  const patterns: LearnedPattern[] = [];

  if (input.completionStatus === 'INCOMPLETE' || input.completionStatus === 'REJECTED') {
    patterns.push({
      patternId: 'failure-0001',
      patternType: 'COMPLETION_FAILURE',
      description: `Project ${input.projectId} ended as ${input.completionStatus}`,
      source: input.verificationId,
    });
  }

  for (const result of input.verificationResults.filter((v) => v.result === 'FAILED')) {
    patterns.push({
      patternId: `failure-verify-${result.pointId.length}`,
      patternType: 'VERIFICATION_FAILURE',
      description: result.description,
      source: result.pointId,
    });
  }

  for (const result of input.riskControlResults.filter((r) => r.result === 'FAILED')) {
    patterns.push({
      patternId: `failure-risk-${result.controlId.length}`,
      patternType: 'RISK_FAILURE',
      description: result.description,
      source: result.controlId,
    });
  }

  for (const outcome of input.outcomes) {
    if (outcome.toLowerCase().includes('fail') || outcome.toLowerCase().includes('error')) {
      patterns.push({
        patternId: `failure-outcome-${outcome.length}`,
        patternType: 'OUTCOME_FAILURE',
        description: outcome,
        source: input.planId,
      });
    }
  }

  if (analysis.verificationFailCount > 0 && patterns.length === 0) {
    patterns.push({
      patternId: 'failure-0002',
      patternType: 'VERIFICATION_FAILURE',
      description: `${analysis.verificationFailCount} verification failure(s) detected`,
      source: input.verificationId,
    });
  }

  return patterns;
}

export function failurePatternsKey(patterns: LearnedPattern[]): string {
  return patterns.map((p) => `${p.patternType}|${p.description.length}`).join(';');
}
