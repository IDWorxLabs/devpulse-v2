/**
 * Autonomous Debugging Engine — patch scope planning.
 */

import type { PatchScopePlan, RepairPlan } from './autonomous-debugging-types.js';

export function planPatchScope(repairPlan: RepairPlan): PatchScopePlan {
  const file = repairPlan.affectedFiles[0] ?? 'unknown';
  const component = file.split('/').pop()?.replace(/\.tsx?$/, '') ?? 'Unknown';

  return {
    readOnly: true,
    repairId: repairPlan.repairId,
    targetFiles: repairPlan.affectedFiles,
    targetComponents: [component],
    targetFunctions: inferFunctions(repairPlan.repairStrategy),
    targetServices: [`${component.toLowerCase()}.service`],
    targetRoutes: [],
    targetStyles: repairPlan.repairStrategy.includes('LAYOUT') || repairPlan.repairStrategy.includes('STYLE')
      ? [`${component}.module.css`]
      : [],
    doNotTouchFiles: repairPlan.forbiddenFiles,
    regressionSensitiveAreas: ['shared-routes', 'core-shell', 'auth'],
  };
}

function inferFunctions(strategy: RepairPlan['repairStrategy']): string[] {
  switch (strategy) {
    case 'CONNECT_EXISTING_HANDLER':
    case 'ADD_MISSING_HANDLER':
      return ['handleSave', 'onClick'];
    case 'FIX_DATA_MUTATION':
      return ['saveExpense', 'persistRecord'];
    case 'FIX_LAYOUT_OVERFLOW':
    case 'FIX_DEVICE_SPECIFIC_STYLE':
      return ['ExpenseCreateFeature'];
    case 'FIX_ACCESSIBLE_LABEL':
      return ['AmountInput'];
    default:
      return ['repairTarget'];
  }
}
