/**
 * Validation Runtime Governance V1 — tier registry builder.
 */

import type { ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/validation-runtime-audit-types.js';
import {
  AFLA_VALIDATORS,
  FORBIDDEN_FAST_PATTERNS,
  LAUNCH_ONLY_VALIDATORS,
} from './validation-runtime-governance-bounds.js';
import type { TierRegistry, TierRegistryEntry, ValidationTier } from './validation-runtime-governance-types.js';

function isAflaValidator(name: string): boolean {
  return AFLA_VALIDATORS.includes(name) || /afla|autonomous-founder-launch/.test(name);
}

function isLaunchOnly(name: string, category: string): boolean {
  if (LAUNCH_ONLY_VALIDATORS.includes(name)) return true;
  if (category === 'LAUNCH' || category === 'AFLA') return true;
  if (/large-scale-multi-app|launch-council|launch-readiness|production-readiness/.test(name)) return true;
  return false;
}

function isForbiddenInFast(name: string, category: string): boolean {
  if (isAflaValidator(name)) return true;
  if (category === 'CAPABILITY_AUDIT' || category === 'UVL') return true;
  if (/large-scale-multi-app/.test(name)) return true;
  return FORBIDDEN_FAST_PATTERNS.some((p) => p.test(name));
}

function resolveMinimumTier(metric: ValidatorRuntimeMetric): ValidationTier {
  if (isLaunchOnly(metric.validatorName, metric.category)) return 'LAUNCH';
  if (isAflaValidator(metric.validatorName)) return 'FULL';
  if (
    metric.category === 'REAL_BUILD_EXECUTION' ||
    metric.category === 'ENGINEERING' ||
    metric.category === 'FEATURE_REALITY' ||
    metric.category === 'BLUEPRINT'
  ) {
    return 'FULL';
  }
  if (
    metric.category === 'WORLD2' ||
    metric.category === 'CONNECTED_PIPELINE' ||
    metric.category === 'OPERATOR' ||
    metric.workPatterns.previewServerCount > 0 ||
    metric.workPatterns.npmBuildCount > 0
  ) {
    return 'STANDARD';
  }
  if (metric.costTier === 'LOW' && metric.runtimeSeconds <= 30) return 'FAST';
  if (metric.costTier === 'MEDIUM') return 'STANDARD';
  return 'FULL';
}

function resolveAllowedTiers(minimumTier: ValidationTier, forbiddenInFast: boolean): ValidationTier[] {
  const order: ValidationTier[] = ['FAST', 'STANDARD', 'FULL', 'LAUNCH'];
  const minIndex = order.indexOf(minimumTier);
  const allowed = order.slice(minIndex === -1 ? 0 : minIndex);
  if (forbiddenInFast) {
    return allowed.filter((t) => t !== 'FAST');
  }
  return allowed;
}

export function buildTierRegistry(metrics: readonly ValidatorRuntimeMetric[]): TierRegistry {
  const registered = metrics.filter((m) => m.registeredInPackageJson);
  const entries: TierRegistryEntry[] = registered.map((metric) => {
    const forbiddenInFast = isForbiddenInFast(metric.validatorName, metric.category);
    const minimumTier = resolveMinimumTier(metric);
    const allowedTiers = resolveAllowedTiers(minimumTier, forbiddenInFast);
    return {
      validatorName: metric.validatorName,
      category: metric.category,
      costTier: metric.costTier,
      minimumTier,
      allowedTiers,
      forbiddenInFast,
      aflaGated: isAflaValidator(metric.validatorName),
    };
  });

  const tierCounts: Record<ValidationTier, number> = {
    FAST: 0,
    STANDARD: 0,
    FULL: 0,
    LAUNCH: 0,
  };
  for (const entry of entries) {
    for (const tier of entry.allowedTiers) {
      tierCounts[tier]++;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    entries,
    tierCounts,
  };
}

export function getValidatorsForTier(
  tierRegistry: TierRegistry,
  tier: ValidationTier,
): readonly string[] {
  return tierRegistry.entries
    .filter((e) => e.allowedTiers.includes(tier) && e.minimumTier !== 'LAUNCH' || tier === 'LAUNCH')
    .filter((e) => {
      if (tier === 'LAUNCH') return e.minimumTier === 'LAUNCH' || e.allowedTiers.includes('LAUNCH');
      const tierOrder: ValidationTier[] = ['FAST', 'STANDARD', 'FULL', 'LAUNCH'];
      return tierOrder.indexOf(tier) >= tierOrder.indexOf(e.minimumTier) && e.allowedTiers.includes(tier);
    })
    .map((e) => e.validatorName);
}
