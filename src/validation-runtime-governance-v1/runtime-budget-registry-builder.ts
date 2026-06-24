/**
 * Validation Runtime Governance V1 — runtime budget registry.
 */

import type { ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/validation-runtime-audit-types.js';
import type { RuntimeBudgetEntry, RuntimeBudgetRegistry } from './validation-runtime-governance-types.js';

const BUDGET_SECONDS: Record<string, number> = {
  LOW: 30,
  MEDIUM: 120,
  HIGH: 300,
  CRITICAL: 900,
};

function classifyBreach(
  runtimeSeconds: number,
  budgetSeconds: number,
): RuntimeBudgetEntry['breachSeverity'] {
  if (runtimeSeconds <= budgetSeconds) return 'NONE';
  if (runtimeSeconds <= budgetSeconds * 1.5) return 'WARNING';
  return 'CRITICAL';
}

export function buildRuntimeBudgetRegistry(metrics: readonly ValidatorRuntimeMetric[]): RuntimeBudgetRegistry {
  const registered = metrics.filter((m) => m.registeredInPackageJson);
  const entries: RuntimeBudgetEntry[] = registered.map((metric) => {
    const budgetSeconds = BUDGET_SECONDS[metric.costTier];
    const withinBudget = metric.runtimeSeconds <= budgetSeconds;
    return {
      validatorName: metric.validatorName,
      budgetCategory: metric.costTier,
      budgetSeconds,
      runtimeSeconds: metric.runtimeSeconds,
      withinBudget,
      breachSeverity: classifyBreach(metric.runtimeSeconds, budgetSeconds),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    entries,
    breachCount: entries.filter((e) => e.breachSeverity !== 'NONE').length,
  };
}
