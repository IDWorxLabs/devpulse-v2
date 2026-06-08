/**
 * Warning pattern engine — extracts warning patterns from project data.
 * Learning only. No execution.
 */

import type { ProjectAnalysis } from './project-analysis-engine.js';
import type { LearnedPattern, LearningInput } from './types.js';

export function extractWarningPatterns(
  input: LearningInput,
  analysis: ProjectAnalysis,
): LearnedPattern[] {
  const patterns: LearnedPattern[] = [];

  if (input.completionStatus === 'COMPLETE_WITH_WARNINGS') {
    patterns.push({
      patternId: 'warning-0001',
      patternType: 'COMPLETION_WARNING',
      description: 'Project completed with non-critical warnings',
      source: input.verificationId,
    });
  }

  for (const warning of input.warnings) {
    patterns.push({
      patternId: `warning-input-${warning.length}`,
      patternType: 'INPUT_WARNING',
      description: warning,
      source: input.planId,
    });
  }

  for (const result of input.verificationResults.filter((v) => v.result === 'WARNING')) {
    patterns.push({
      patternId: `warning-verify-${result.pointId.length}`,
      patternType: 'VERIFICATION_WARNING',
      description: result.description,
      source: result.pointId,
    });
  }

  for (const result of input.riskControlResults.filter((r) => r.result === 'WARNING')) {
    patterns.push({
      patternId: `warning-risk-${result.controlId.length}`,
      patternType: 'RISK_WARNING',
      description: result.description,
      source: result.controlId,
    });
  }

  if (analysis.rollbackWarningCount > 0) {
    patterns.push({
      patternId: 'warning-0002',
      patternType: 'ROLLBACK_WARNING',
      description: `${analysis.rollbackWarningCount} rollback warning(s) identified`,
      source: input.simulationId,
    });
  }

  return patterns;
}

export function warningPatternsKey(patterns: LearnedPattern[]): string {
  return patterns.map((p) => `${p.patternType}|${p.description.length}`).join(';');
}
