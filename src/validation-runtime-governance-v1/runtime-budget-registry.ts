/**
 * Validation Runtime Governance V1 — runtime budget registry.
 */

import { MEASURED_RUNTIME_BASELINES } from '../validation-runtime-audit-v1/index.js';
import type { ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/index.js';
import type { RuntimeBudgetEntry } from './validation-runtime-governance-v1-types.js';

const BUDGET_MULTIPLIER: Record<string, number> = {
  LOW: 1.0,
  MEDIUM: 1.25,
  HIGH: 1.5,
  CRITICAL: 2.0,
};

export function buildRuntimeBudgetRegistry(
  metrics: readonly ValidatorRuntimeMetric[],
): readonly RuntimeBudgetEntry[] {
  return metrics
    .filter((m) => m.registeredInPackageJson)
    .map((metric) => {
      const measured = MEASURED_RUNTIME_BASELINES[metric.validatorName] ?? null;
      const multiplier = BUDGET_MULTIPLIER[metric.costTier] ?? 1.0;
      const baseSeconds = measured ?? metric.runtimeSeconds;
      const budgetSeconds = Math.round(baseSeconds * multiplier * 10) / 10;

      return {
        validatorName: metric.validatorName,
        budgetSeconds,
        budgetCategory: metric.costTier,
        measuredSeconds: measured,
        estimatedSeconds: metric.runtimeSeconds,
        breachBecomesAuditFinding: metric.costTier === 'HIGH' || metric.costTier === 'CRITICAL',
      };
    })
    .sort((a, b) => b.budgetSeconds - a.budgetSeconds);
}

export function isRuntimeBudgetBreached(
  validatorName: string,
  actualSeconds: number,
  registry: readonly RuntimeBudgetEntry[],
): boolean {
  const entry = registry.find((e) => e.validatorName === validatorName);
  if (!entry) return false;
  return actualSeconds > entry.budgetSeconds;
}
