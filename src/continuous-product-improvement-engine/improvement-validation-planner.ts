/**
 * Continuous Product Improvement Engine — targeted validation planning.
 */

import type { ImprovementPlan, ImprovementValidationPlan } from './continuous-improvement-types.js';

export function planImprovementValidation(plan: ImprovementPlan): ImprovementValidationPlan {
  return {
    readOnly: true,
    improvementId: plan.improvementId,
    validators: plan.validationPlan,
  };
}
