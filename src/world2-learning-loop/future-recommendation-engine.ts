/**
 * Future recommendation engine — generates guidance for future World 2 projects.
 * Learning only. No execution or modification.
 */

import type { ProjectAnalysis } from './project-analysis-engine.js';
import type { LearnedPattern, LearningConfidence, LearningInput } from './types.js';

export function generateFutureRecommendations(
  input: LearningInput,
  analysis: ProjectAnalysis,
  successPatterns: LearnedPattern[],
  failurePatterns: LearnedPattern[],
  warningPatterns: LearnedPattern[],
): string[] {
  const recommendations: string[] = [
    'World 2 Learning Loop Foundation V1 — learning only. No execution, file modification, or code generation.',
  ];

  if (successPatterns.length > 0) {
    recommendations.push(
      `Reuse ${successPatterns.length} success pattern(s) from project ${input.projectId} in future planning.`,
    );
  }

  if (failurePatterns.length > 0) {
    recommendations.push(
      `Avoid ${failurePatterns.length} identified failure pattern(s) in future simulations and builder packets.`,
    );
  }

  if (warningPatterns.length > 0) {
    recommendations.push(
      `Address ${warningPatterns.length} warning pattern(s) earlier in future project lifecycles.`,
    );
  }

  if (analysis.verificationFailCount > 0) {
    recommendations.push('Strengthen verification gates before builder phase in future projects.');
  }

  if (input.completionStatus === 'REJECTED') {
    recommendations.push('Ensure workspace ownership and governance validation before planning future projects.');
  }

  if (input.completionConfidence === 'LOW') {
    recommendations.push('Increase evidence collection and simulation confidence for future projects.');
  }

  for (const observation of input.observations) {
    recommendations.push(`Observation for future projects: ${observation}`);
  }

  recommendations.push('Confirm verification_gated_apply readiness before any future execution phase.');

  return recommendations;
}

export function determineLearningConfidence(
  lessonCount: number,
  completionConfidence: LearningInput['completionConfidence'],
): LearningConfidence {
  if (lessonCount >= 15 && completionConfidence === 'HIGH') return 'HIGH';
  if (lessonCount >= 8) return 'MEDIUM';
  return 'LOW';
}

export function futureRecommendationsKey(recommendations: string[]): string {
  return recommendations.map((r) => String(r.length)).join(';');
}

export function compileLessonCount(
  successPatterns: LearnedPattern[],
  failurePatterns: LearnedPattern[],
  warningPatterns: LearnedPattern[],
  recommendationPatterns: LearnedPattern[],
  verificationPatterns: LearnedPattern[],
  riskPatterns: LearnedPattern[],
  rollbackPatterns: LearnedPattern[],
  governancePatterns: LearnedPattern[],
  workspacePatterns: LearnedPattern[],
): number {
  return (
    successPatterns.length +
    failurePatterns.length +
    warningPatterns.length +
    recommendationPatterns.length +
    verificationPatterns.length +
    riskPatterns.length +
    rollbackPatterns.length +
    governancePatterns.length +
    workspacePatterns.length
  );
}
