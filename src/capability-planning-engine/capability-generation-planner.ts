/**
 * Capability Planning Engine Era 3 — safe missing capability generation planning.
 */

import type { CapabilityGap, CapabilityGenerationPlanEra3 } from './capability-planning-types.js';
import { isSafePaymentPlaceholderCapabilityName } from '../safe-payment-placeholder-policy/index.js';

let genCounter = 0;

export function resetCapabilityGenerationPlannerForTests(): void {
  genCounter = 0;
}

const HIGH_RISK_PATTERNS = [
  /payment|billing|stripe/i,
  /medical diagnosis/i,
  /identity verification/i,
  /financial transaction/i,
  /account deletion/i,
  /database migration/i,
  /location tracking/i,
  /sensitive data export/i,
];

export function planCapabilityGeneration(
  gaps: readonly CapabilityGap[],
): CapabilityGenerationPlanEra3[] {
  const plans: CapabilityGenerationPlanEra3[] = [];

  for (const gap of gaps) {
    if (gap.decision !== 'GENERATE_MISSING') continue;
    if (isSafePaymentPlaceholderCapabilityName(gap.requiredCapability.name)) continue;
    if (HIGH_RISK_PATTERNS.some((p) => p.test(gap.requiredCapability.name))) continue;

    genCounter += 1;
    const slug = gap.requiredCapability.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    plans.push({
      readOnly: true,
      planId: `gen-plan-${genCounter}`,
      capabilityName: gap.requiredCapability.name,
      reasonRequired: gap.requiredCapability.description,
      sourceRequirementIds: gap.requiredCapability.sourceRequirementIds,
      expectedInterfaces: [`${slug}Service`, `${slug}Types`, `${slug}Validation`],
      requiredFiles: [
        `src/features/${slug}/${slug}Feature.tsx`,
        `src/features/${slug}/${slug}.service.ts`,
        `src/features/${slug}/${slug}.types.ts`,
      ],
      requiredTests: [`scripts/validate-${slug}.ts`],
      requiredValidators: ['STATIC', 'TYPECHECK', 'INTEGRATION', 'PROMPT_FAITHFULNESS'],
      integrationPoints: ['FeatureAppRouter', 'universal-app-blueprint'],
      dependencies: gap.matchedCapabilityId ? [gap.matchedCapabilityId] : ['cap-crud'],
      rollbackPlan: [`Remove src/features/${slug}`, 'Revert registry entry', 'Restore prior router map'],
      riskLevel: gap.risk,
      safetyConstraints: ['Prompt evidence required', 'Isolated module boundary', 'Deterministic validation only'],
    });
  }

  return plans;
}
