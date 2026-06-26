/**
 * Continuous Product Improvement Engine — regression validation planning.
 */

import type { ImprovementPlan, ImprovementRegressionPlan } from './continuous-improvement-types.js';

export function planImprovementRegression(plan: ImprovementPlan): ImprovementRegressionPlan {
  return {
    readOnly: true,
    improvementId: plan.improvementId,
    checks: plan.regressionPlan,
  };
}
