/**
 * Verification Intelligence — plan optimization without reducing safety minimums.
 */

import type { VerificationPlanType } from './verification-plan-types.js';
import { getVerificationPathEntry } from './verification-path-registry.js';

let optimizerReductions = 0;

const VALIDATOR_ORDER_PRIORITY: Record<string, number> = {
  'Runtime Validation': 1,
  Runtime: 1,
  'Route Validation': 2,
  'Intelligence Validation': 3,
  'Brain Validation': 3,
  'Cloud Validation': 4,
  'Execution Validation': 5,
  'World2 Validation': 6,
  'Release Validation': 7,
  'Trust Validation': 8,
  UVL: 9,
  'UVL Validation': 9,
  'Report Generation': 10,
  'Data Model Validation': 6,
};

export function buildExecutionOrder(
  validators: string[],
  planType: VerificationPlanType,
  riskScore: number,
): string[] {
  const path = getVerificationPathEntry(planType);
  const base = [...new Set([...validators, ...(path?.expectedValidatorGroups ?? [])])];

  const ordered = base.sort((a, b) => {
    const pa = VALIDATOR_ORDER_PRIORITY[a] ?? 50;
    const pb = VALIDATOR_ORDER_PRIORITY[b] ?? 50;
    return pa - pb;
  });

  if (riskScore >= 70 && !ordered.includes('Report Generation')) {
    ordered.push('Report Generation');
  }

  return ordered.map((v) => (v.endsWith('Validation') ? v : `${v} Validation`));
}

export function optimizeVerificationPlan(
  requiredValidators: string[],
  optionalValidators: string[],
  planType: VerificationPlanType,
  riskScore: number,
): {
  requiredValidators: string[];
  optionalValidators: string[];
  executionOrder: string[];
  reductions: number;
} {
  const path = getVerificationPathEntry(planType);
  const minimumRequired = new Set([
    ...requiredValidators,
    ...(path?.expectedValidatorGroups ?? []),
  ]);

  const dedupedRequired = [...minimumRequired];
  const dedupedOptional = optionalValidators.filter((v) => !minimumRequired.has(v));

  const beforeCount = requiredValidators.length + optionalValidators.length;
  const afterCount = dedupedRequired.length + dedupedOptional.length;
  const reductions = Math.max(0, beforeCount - afterCount);
  optimizerReductions += reductions;

  const executionOrder = buildExecutionOrder(dedupedRequired, planType, riskScore);

  return {
    requiredValidators: dedupedRequired,
    optionalValidators: dedupedOptional,
    executionOrder,
    reductions,
  };
}

export function getOptimizerReductionCount(): number {
  return optimizerReductions;
}

export function resetVerificationPlanOptimizerForTests(): void {
  optimizerReductions = 0;
}
