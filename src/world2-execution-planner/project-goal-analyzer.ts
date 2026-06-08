/**
 * Project goal analyzer — derives structured goal analysis from planner input.
 * Planning only. No execution.
 */

import type { PlannerInput } from './types.js';

export interface GoalAnalysis {
  normalizedGoal: string;
  normalizedVision: string;
  normalizedType: string;
  requirementCount: number;
  constraintCount: number;
  complexityScore: number;
}

export function analyzeProjectGoal(input: PlannerInput): GoalAnalysis {
  const normalizedGoal = input.projectGoal.trim();
  const normalizedVision = input.projectVision.trim();
  const normalizedType = input.projectType.trim().toLowerCase().replace(/\s+/g, '-');
  const requirementCount = input.requirements.length;
  const constraintCount = input.constraints.length;
  const complexityScore = requirementCount + constraintCount + (normalizedType.includes('enterprise') ? 2 : 0);

  return {
    normalizedGoal,
    normalizedVision,
    normalizedType,
    requirementCount,
    constraintCount,
    complexityScore,
  };
}

export function goalAnalysisKey(input: PlannerInput): string {
  const analysis = analyzeProjectGoal(input);
  return `${analysis.normalizedType}|${analysis.requirementCount}|${analysis.constraintCount}|${analysis.complexityScore}`;
}

export function deriveNextRecommendedStep(
  analysis: GoalAnalysis,
  firstStage: string,
): string {
  if (analysis.complexityScore >= 5) {
    return `Begin ${firstStage} with governance review and dependency validation`;
  }
  return `Begin ${firstStage} phase for ${analysis.normalizedType} project`;
}
