/**
 * ASE — quality loop router (Continuous Product Improvement).
 */

import type { ContinuousImprovementPipelineResult } from '../continuous-product-improvement-engine/continuous-improvement-types.js';

export function routeAseQualityLoop(input: {
  continuousImprovement: ContinuousImprovementPipelineResult;
}): {
  readOnly: true;
  improvementRequired: boolean;
  criticalAttempted: boolean;
  deferredWithEvidence: boolean;
  unsafeBlocked: boolean;
  regressionDetected: boolean;
  launchEvidencePublished: boolean;
} {
  return {
    readOnly: true,
    improvementRequired: input.continuousImprovement.rankedOpportunities.length > 0,
    criticalAttempted: input.continuousImprovement.improvementLoops.some((l) => l.resolved),
    deferredWithEvidence: input.continuousImprovement.deferredOpportunities.length > 0,
    unsafeBlocked: input.continuousImprovement.blockedOpportunities.length > 0,
    regressionDetected: input.continuousImprovement.improvementAttempts.some((a) => a.outcome === 'ROLLED_BACK'),
    launchEvidencePublished: input.continuousImprovement.permissionVerdict === 'READY_FOR_PREVIEW' ||
      input.continuousImprovement.permissionVerdict === 'DEFERRED_ACCEPTABLE',
  };
}
