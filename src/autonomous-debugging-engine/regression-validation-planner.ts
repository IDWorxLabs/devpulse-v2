/**
 * Autonomous Debugging Engine — regression validation planning.
 */

import type { RegressionValidationPlan, RepairPlan } from './autonomous-debugging-types.js';

export function planRegressionValidation(repairPlan: RepairPlan): RegressionValidationPlan {
  return {
    readOnly: true,
    repairId: repairPlan.repairId,
    checks: repairPlan.regressionPlan,
  };
}
