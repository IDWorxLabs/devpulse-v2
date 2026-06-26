/**
 * Autonomous Debugging Engine — patch application planning.
 */

import type { PatchApplicationPlan, PatchScopePlan, RepairPlan } from './autonomous-debugging-types.js';

let patchCounter = 0;

export function resetPatchApplicationPlannerForTests(): void {
  patchCounter = 0;
}

export function planPatchApplication(input: {
  repairPlan: RepairPlan;
  patchScope: PatchScopePlan;
}): PatchApplicationPlan {
  patchCounter += 1;
  const changes = describeChanges(input.repairPlan.repairStrategy);

  return {
    readOnly: true,
    patchId: `patch-${patchCounter}`,
    repairPlanId: input.repairPlan.repairId,
    filesToModify: input.patchScope.targetFiles,
    changesToApply: changes,
    expectedDiffSummary: `${input.repairPlan.repairStrategy}: ${changes.join('; ')}`,
    atomicityRequirements: ['Single feature slice', 'Rollback snapshot required'],
    rollbackSnapshot: input.repairPlan.rollbackPlan,
    postPatchValidators: input.repairPlan.validationPlan,
  };
}

function describeChanges(strategy: RepairPlan['repairStrategy']): string[] {
  switch (strategy) {
    case 'CONNECT_EXISTING_HANDLER':
      return ['Bind onClick to saveExpenseHandler'];
    case 'ADD_MISSING_HANDLER':
      return ['Add saveExpenseHandler function', 'Bind handler to Save button'];
    case 'FIX_DATA_MUTATION':
      return ['Add persistExpense call in save handler', 'Await service mutation'];
    case 'FIX_LAYOUT_OVERFLOW':
      return ['Adjust mobile padding', 'Fix overflow on phone portrait save button'];
    case 'FIX_DEVICE_SPECIFIC_STYLE':
      return ['Add responsive styles for save button'];
    case 'FIX_ACCESSIBLE_LABEL':
      return ['Add aria-label to amount input', 'Associate label element'];
    case 'ADD_STATE_UPDATE':
      return ['Update form state after save'];
    default:
      return ['Apply targeted fix'];
  }
}
