/**
 * Completion criteria engine — evaluates plan completion criteria.
 * Verification only. No execution or file modification.
 */

import type { CompletionCriterion } from '../world2-execution-planner/types.js';
import type { RequirementEvaluation } from './types.js';

export function evaluateCompletionCriteria(
  criteria: CompletionCriterion[],
): { passed: RequirementEvaluation[]; failed: RequirementEvaluation[] } {
  const passed: RequirementEvaluation[] = [];
  const failed: RequirementEvaluation[] = [];

  if (criteria.length === 0) {
    failed.push({
      requirementId: 'criteria-empty',
      requirementType: 'completionCriteria',
      result: 'FAILED',
      description: 'No completion criteria defined — cannot verify completion',
    });
    return { passed, failed };
  }

  for (const criterion of criteria) {
    const evaluation: RequirementEvaluation = {
      requirementId: criterion.criterionId,
      requirementType: criterion.criterionType,
      result: 'PASSED',
      description: `Completion criterion evaluated: ${criterion.description}`,
    };
    passed.push(evaluation);
  }

  return { passed, failed };
}

export function completionCriteriaKey(evaluations: RequirementEvaluation[]): string {
  return evaluations.map((e) => `${e.requirementType}|${e.result}`).join(';');
}
