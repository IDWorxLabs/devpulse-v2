/**
 * Continuous Product Improvement Engine — safe application planning.
 */

import type {
  ImprovementApplicationPlan,
  ImprovementPatchScope,
  ImprovementPlan,
} from './continuous-improvement-types.js';

let patchCounter = 0;

export function resetImprovementApplicationPlannerForTests(): void {
  patchCounter = 0;
}

export function planImprovementApplication(input: {
  improvementPlan: ImprovementPlan;
  patchScope: ImprovementPatchScope;
}): ImprovementApplicationPlan {
  patchCounter += 1;
  const files = [...input.improvementPlan.allowedFiles].slice(0, 3);

  return {
    readOnly: true,
    patchId: `patch-${patchCounter}`,
    improvementPlanId: input.improvementPlan.improvementId,
    filesToModify: files,
    expectedDiffSummary: `${input.improvementPlan.patchStrategy} on ${files.join(', ')}`,
    atomicityRequirements: ['single-opportunity-per-patch', 'rollback-snapshot-before-apply'],
    rollbackSnapshot: input.improvementPlan.rollbackPlan,
    postPatchValidators: input.improvementPlan.validationPlan,
    affectedEvidenceSources: ['VIRTUAL_USER', 'INTERACTION_PROOF', 'VIRTUAL_DEVICE'],
  };
}
