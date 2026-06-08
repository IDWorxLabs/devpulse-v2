/**
 * Project analysis engine — analyzes project data for learning extraction.
 * Learning only. No modification of code, files, or governance.
 */

import type { LearningInput } from './types.js';

export interface ProjectAnalysis {
  projectId: string;
  completionStatus: LearningInput['completionStatus'];
  completionConfidence: LearningInput['completionConfidence'];
  outcomeCount: number;
  observationCount: number;
  warningCount: number;
  recommendationCount: number;
  verificationPassCount: number;
  verificationFailCount: number;
  riskWarningCount: number;
  rollbackWarningCount: number;
  analysisSummary: string;
}

export function analyzeProjectData(input: LearningInput): ProjectAnalysis {
  const verificationPassCount = input.verificationResults.filter((v) => v.result === 'PASSED').length;
  const verificationFailCount = input.verificationResults.filter((v) => v.result === 'FAILED').length;
  const riskWarningCount = input.riskControlResults.filter((r) => r.result === 'WARNING').length;
  const rollbackWarningCount = input.rollbackResults.filter((r) => r.result === 'WARNING').length;

  return {
    projectId: input.projectId,
    completionStatus: input.completionStatus,
    completionConfidence: input.completionConfidence,
    outcomeCount: input.outcomes.length,
    observationCount: input.observations.length,
    warningCount: input.warnings.length,
    recommendationCount: input.recommendations.length,
    verificationPassCount,
    verificationFailCount,
    riskWarningCount,
    rollbackWarningCount,
    analysisSummary: `Analyzed ${input.projectId}: ${input.completionStatus} with ${input.completionConfidence} confidence`,
  };
}

export function projectAnalysisKey(analysis: ProjectAnalysis): string {
  return [
    analysis.completionStatus,
    analysis.completionConfidence,
    analysis.verificationPassCount,
    analysis.verificationFailCount,
    analysis.outcomeCount,
    analysis.observationCount,
  ].join('|');
}
