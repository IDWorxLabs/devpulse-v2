/**
 * Continuous Product Improvement Engine — narrow patch scope planning.
 */

import type { ImprovementPatchScope, ImprovementPlan } from './continuous-improvement-types.js';

export function planImprovementPatchScope(plan: ImprovementPlan): ImprovementPatchScope {
  const feature = plan.affectedScope[0] ?? 'shared-ui';
  const componentName = feature
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');

  return {
    readOnly: true,
    improvementId: plan.improvementId,
    targetFeatureSlices: plan.affectedScope,
    targetComponents: [`${componentName}Feature`],
    targetServices: [`${feature}.service.ts`],
    targetStyles: plan.patchStrategy === 'OPTIMIZE_RENDER_PATH' ? [`${feature}.module.css`] : [],
    targetValidators: plan.validationPlan.filter((v) => v.includes('validation') || v.includes('check')),
    targetTests: [],
    doNotTouchAreas: [...plan.forbiddenFiles],
    regressionSensitiveAreas: ['core-workflows', 'prompt-faithfulness-contract', 'auth-routing'],
  };
}
