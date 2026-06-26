/**
 * Autonomous Debugging Engine — targeted validation planning.
 */

import type { RepairPlan, TargetedValidationPlan } from './autonomous-debugging-types.js';

export function planTargetedValidation(repairPlan: RepairPlan): TargetedValidationPlan {
  return {
    readOnly: true,
    repairId: repairPlan.repairId,
    validators: repairPlan.validationPlan,
  };
}
