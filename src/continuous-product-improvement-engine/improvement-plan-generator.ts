/**
 * Continuous Product Improvement Engine — improvement plan generation.
 */

import type { ImprovementOpportunity, ImprovementPlan } from './continuous-improvement-types.js';
import { resolveImprovementStrategy } from './improvement-safety-assessor.js';

let planCounter = 0;

export function resetImprovementPlanGeneratorForTests(): void {
  planCounter = 0;
}

function nextImprovementId(): string {
  planCounter += 1;
  return `improvement-${planCounter}`;
}

function targetFilesForOpportunity(opp: ImprovementOpportunity): { allowed: string[]; forbidden: string[] } {
  const feature = opp.affectedFeatures[0] ?? 'shared';
  const allowed = [`src/features/${feature}/${feature}.service.ts`];
  if (opp.category === 'ACCESSIBILITY_IMPROVEMENT') {
    allowed.push(`src/features/${feature}/${feature}Feature.tsx`);
  }
  if (opp.category === 'PERFORMANCE_OPTIMIZATION') {
    allowed.push(`src/features/${feature}/${feature}.module.css`);
  }
  if (opp.category === 'USABILITY_IMPROVEMENT' && /emergency/i.test(opp.summary)) {
    allowed.push('src/features/emergency-speech/emergency-speech.service.ts');
  }
  return {
    allowed,
    forbidden: ['src/blueprint/AppShell.tsx', 'src/features/FeatureAppRouter.tsx', 'feature-contract.json'],
  };
}

export function generateImprovementPlan(input: {
  opportunity: ImprovementOpportunity;
}): ImprovementPlan {
  const strategy = resolveImprovementStrategy(input.opportunity);
  const files = targetFilesForOpportunity(input.opportunity);
  const qualityDelta =
    input.opportunity.category === 'USABILITY_IMPROVEMENT' ? 12 :
    input.opportunity.category === 'ACCESSIBILITY_IMPROVEMENT' ? 10 :
    input.opportunity.category === 'PERFORMANCE_OPTIMIZATION' ? 8 :
    4;

  return {
    readOnly: true,
    improvementId: nextImprovementId(),
    opportunityIds: [input.opportunity.opportunityId],
    targetOutcome: input.opportunity.expectedBenefit,
    affectedScope: input.opportunity.affectedFeatures.length
      ? input.opportunity.affectedFeatures
      : ['shared-ui'],
    allowedFiles: files.allowed,
    forbiddenFiles: files.forbidden,
    patchStrategy: strategy,
    validationPlan: [
      'affected-feature-validation',
      'prompt-faithfulness-scan',
      strategy === 'REDUCE_STEPS' ? 'affected-virtual-user-journey' : 'affected-behavior-simulation',
      strategy === 'IMPROVE_ACCESSIBLE_LABEL' ? 'accessibility-check' : 'interaction-proof-sample',
      strategy === 'OPTIMIZE_RENDER_PATH' ? 'performance-sample' : 'capability-readiness-scan',
    ],
    regressionPlan: [
      'previously-stable-feature-slices',
      'core-workflows',
      'prompt-faithfulness-delta',
      'virtual-user-journeys',
      'device-matrix-spot-check',
    ],
    rollbackPlan: `snapshot-before-${input.opportunity.opportunityId}`,
    safetyConstraints: [
      'Do not remove required prompt behavior',
      'Do not weaken security',
      'Do not hide errors instead of fixing them',
      'Do not reduce accessibility',
    ],
    expectedQualityDelta: qualityDelta,
    confidence: input.opportunity.effort === 'LOW' ? 'HIGH' : 'MEDIUM',
  };
}
