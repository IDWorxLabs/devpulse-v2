/**
 * Validation Runtime Governance V1 — tier registry (FAST / STANDARD / FULL / LAUNCH).
 */

import {
  FAST_FORBIDDEN_PATTERNS,
  LAUNCH_TIER_VALIDATORS,
  TIER_TARGET_RUNTIME_SECONDS,
} from './validation-runtime-governance-v1-bounds.js';
import type {
  TierDefinition,
  ValidationTier,
  ValidatorTierAssignment,
} from './validation-runtime-governance-v1-types.js';
import type { ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/index.js';

export const TIER_DEFINITIONS: readonly TierDefinition[] = [
  {
    tier: 'FAST',
    targetRuntimeSeconds: TIER_TARGET_RUNTIME_SECONDS.FAST,
    description: 'During implementation — targeted validators only',
    allowedCategories: [
      'CQI',
      'FOUNDATION',
      'OPERATOR',
      'OTHER',
    ],
    forbiddenCategories: [
      'AFLA',
      'UVL',
      'CAPABILITY_AUDIT',
      'REAL_BUILD_EXECUTION',
      'FEATURE_REALITY',
      'BLUEPRINT',
      'LAUNCH',
    ],
    forbiddenValidatorPatterns: [...FAST_FORBIDDEN_PATTERNS],
    explicitValidators: [],
  },
  {
    tier: 'STANDARD',
    targetRuntimeSeconds: TIER_TARGET_RUNTIME_SECONDS.STANDARD,
    description: 'After feature completion — affected capability + integration validators',
    allowedCategories: [
      'CQI',
      'PAI',
      'ENGINEERING',
      'FOUNDATION',
      'OPERATOR',
      'CONNECTED_PIPELINE',
      'WORLD2',
      'OTHER',
    ],
    forbiddenCategories: ['AFLA', 'CAPABILITY_AUDIT', 'LAUNCH'],
    forbiddenValidatorPatterns: ['afla', 'autonomous-founder-launch', 'capability-audit', 'large-scale-multi-app'],
    explicitValidators: [],
  },
  {
    tier: 'FULL',
    targetRuntimeSeconds: TIER_TARGET_RUNTIME_SECONDS.FULL,
    description: 'Milestone completion — cross-capability and major integration validation',
    allowedCategories: [
      'CQI',
      'UVL',
      'REAL_BUILD_EXECUTION',
      'FEATURE_REALITY',
      'BLUEPRINT',
      'ENGINEERING',
      'CONNECTED_PIPELINE',
      'WORLD2',
      'FOUNDATION',
      'OPERATOR',
      'OTHER',
    ],
    forbiddenCategories: [],
    forbiddenValidatorPatterns: [],
    explicitValidators: [
      'validate:real-build-execution-pipeline-v1',
      'validate:real-build-execution-pipeline-v1-1',
      'validate:uvl-verification-execution-v1',
      'validate:feature-reality-v1',
      'validate:engineering-reality-v1',
    ],
  },
  {
    tier: 'LAUNCH',
    targetRuntimeSeconds: TIER_TARGET_RUNTIME_SECONDS.LAUNCH,
    description: 'Launch candidate only — maximum confidence, not speed',
    allowedCategories: [
      'UVL',
      'PAI',
      'AFLA',
      'LAUNCH',
      'CAPABILITY_AUDIT',
      'REAL_BUILD_EXECUTION',
    ],
    forbiddenCategories: [],
    forbiddenValidatorPatterns: [],
    explicitValidators: [...LAUNCH_TIER_VALIDATORS],
  },
];

function matchesForbiddenPattern(validatorName: string, patterns: readonly string[]): boolean {
  const haystack = validatorName.replace('validate:', '');
  return patterns.some((p) => haystack.includes(p));
}

export function isValidatorAllowedInTier(
  validatorName: string,
  category: ValidatorRuntimeMetric['category'],
  tier: ValidationTier,
): boolean {
  const def = TIER_DEFINITIONS.find((d) => d.tier === tier);
  if (!def) return false;

  if (matchesForbiddenPattern(validatorName, def.forbiddenValidatorPatterns)) {
    return false;
  }
  if (def.forbiddenCategories.includes(category)) {
    return false;
  }
  if (tier === 'LAUNCH') {
    return (
      def.explicitValidators.includes(validatorName) ||
      def.allowedCategories.includes(category)
    );
  }
  if (tier === 'FULL' && def.explicitValidators.includes(validatorName)) {
    return true;
  }
  return def.allowedCategories.includes(category) || category === 'OTHER';
}

export function assignValidatorTier(
  metric: ValidatorRuntimeMetric,
): ValidationTier {
  if (LAUNCH_TIER_VALIDATORS.includes(metric.validatorName)) {
    return 'LAUNCH';
  }
  if (
    metric.category === 'AFLA' ||
    metric.validatorName.includes('autonomous-founder-launch')
  ) {
    return 'LAUNCH';
  }
  if (
    metric.category === 'CAPABILITY_AUDIT' ||
    metric.validatorName.includes('large-scale-multi-app')
  ) {
    return 'LAUNCH';
  }
  if (
    metric.category === 'UVL' ||
    metric.category === 'REAL_BUILD_EXECUTION' ||
    metric.costTier === 'CRITICAL'
  ) {
    return 'FULL';
  }
  if (
    metric.category === 'FEATURE_REALITY' ||
    metric.category === 'BLUEPRINT' ||
    metric.category === 'ENGINEERING' ||
    metric.costTier === 'HIGH'
  ) {
    return 'FULL';
  }
  if (metric.costTier === 'MEDIUM' || metric.runtimeSeconds > 30) {
    return 'STANDARD';
  }
  return 'FAST';
}

export function buildTierAssignments(
  metrics: readonly ValidatorRuntimeMetric[],
): readonly ValidatorTierAssignment[] {
  return metrics
    .filter((m) => m.registeredInPackageJson)
    .map((metric) => {
      const tier = assignValidatorTier(metric);
      return {
        validatorName: metric.validatorName,
        tier,
        category: metric.category,
        runtimeBudgetSeconds: budgetForTier(tier, metric),
        budgetCategory: metric.costTier,
        aflaBlockedInFastStandard:
          metric.category === 'AFLA' || metric.validatorName.includes('afla'),
      };
    });
}

function budgetForTier(tier: ValidationTier, metric: ValidatorRuntimeMetric): number {
  const tierCap = TIER_TARGET_RUNTIME_SECONDS[tier];
  if (tier === 'LAUNCH') return metric.runtimeSeconds;
  return Math.min(metric.runtimeSeconds, tierCap);
}

export function getTierDefinition(tier: ValidationTier): TierDefinition | undefined {
  return TIER_DEFINITIONS.find((d) => d.tier === tier);
}

export function listValidatorsForTier(
  tier: ValidationTier,
  assignments: readonly ValidatorTierAssignment[],
): readonly string[] {
  return assignments.filter((a) => a.tier === tier).map((a) => a.validatorName);
}
