/**
 * Verification Integration — plan registration registry.
 */

import type { VerificationPlan } from '../verification-intelligence/verification-plan-types.js';
import type { VerificationIntegrationRecord } from './verification-integration-types.js';

const registry = new Map<string, VerificationIntegrationRecord>();
const byStrategy = new Map<string, Set<string>>();
const byPlanType = new Map<string, Set<string>>();

function planToRecord(plan: VerificationPlan): VerificationIntegrationRecord {
  return {
    planId: plan.id,
    strategyType: plan.strategy,
    planType: plan.type,
    confidence: plan.confidence,
    riskScore: plan.riskScore,
    estimatedCost: plan.estimatedCost,
    estimatedDurationMs: plan.estimatedDurationMs,
    executionOrder: [...plan.executionOrder],
    createdAt: plan.generatedAt,
  };
}

function indexRecord(record: VerificationIntegrationRecord): void {
  if (!byStrategy.has(record.strategyType)) {
    byStrategy.set(record.strategyType, new Set());
  }
  byStrategy.get(record.strategyType)!.add(record.planId);

  if (!byPlanType.has(record.planType)) {
    byPlanType.set(record.planType, new Set());
  }
  byPlanType.get(record.planType)!.add(record.planId);
}

export function registerVerificationPlan(plan: VerificationPlan): VerificationIntegrationRecord {
  const record = planToRecord(plan);
  registry.set(record.planId, record);
  indexRecord(record);
  return record;
}

export function getVerificationPlanById(planId: string): VerificationIntegrationRecord | undefined {
  return registry.get(planId);
}

export function listVerificationPlansByStrategy(strategyType: string): VerificationIntegrationRecord[] {
  const ids = byStrategy.get(strategyType);
  if (!ids) return [];
  return [...ids].map((id) => registry.get(id)!).filter(Boolean);
}

export function listVerificationPlansByPlanType(planType: string): VerificationIntegrationRecord[] {
  const ids = byPlanType.get(planType);
  if (!ids) return [];
  return [...ids].map((id) => registry.get(id)!).filter(Boolean);
}

export function listAllVerificationPlans(): VerificationIntegrationRecord[] {
  return [...registry.values()];
}

export function getVerificationRegistrySize(): number {
  return registry.size;
}

export function resetVerificationPlanRegistrationForTests(): void {
  registry.clear();
  byStrategy.clear();
  byPlanType.clear();
}
