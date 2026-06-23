/**
 * Phase 27.04 — Launch verdict governance normalization repair planner (V1).
 */

import type {
  LaunchVerdictGovernanceNormalizationRepairPlan,
  LaunchVerdictGovernanceShapeDetection,
} from './v5-launch-verdict-governance-source-normalization-types.js';

export function planLaunchVerdictGovernanceNormalizationRepair(
  shapeDetection: LaunchVerdictGovernanceShapeDetection,
): LaunchVerdictGovernanceNormalizationRepairPlan {
  if (!shapeDetection.normalizationRequired) {
    return {
      readOnly: true,
      repairRequired: false,
      actions: ['governance-shape-satisfied'],
      fieldsToNormalize: [],
      reason: null,
    };
  }

  const fieldsToNormalize = [...shapeDetection.missingFieldsBeforeNormalization];
  const actions = fieldsToNormalize.map((field) => `normalize-${field}-to-empty-array`);

  return {
    readOnly: true,
    repairRequired: true,
    actions,
    fieldsToNormalize,
    reason: shapeDetection.reason,
  };
}
