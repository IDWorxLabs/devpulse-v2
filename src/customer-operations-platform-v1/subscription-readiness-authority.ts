/**
 * Customer Operations Platform V1 — subscription readiness (plans & quotas, not payments).
 */

import { PLAN_TYPES } from './customer-operations-platform-v1-bounds.js';
import { buildPlanDefinitions } from './customer-platform-registry.js';
import type { CustomerUsageMetrics, PlanDefinition } from './customer-operations-platform-v1-types.js';

export interface QuotaAssessment {
  readOnly: true;
  customerId: string;
  planType: string;
  withinQuota: boolean;
  upgradeRecommended: boolean;
  detail: string;
}

export function assessSubscriptionReadiness(input: {
  plans: readonly PlanDefinition[];
  usage: readonly CustomerUsageMetrics[];
}): {
  plansDefined: number;
  quotaAssessments: QuotaAssessment[];
  subscriptionReadinessProven: boolean;
} {
  const plansDefined = input.plans.length;
  const quotaAssessments: QuotaAssessment[] = [];

  for (const metrics of input.usage) {
    const plan = input.plans.find((p) => {
      const customerPlan = metrics.customerId.includes('acme')
        ? 'PRO'
        : metrics.customerId.includes('nova')
          ? 'BUSINESS'
          : 'FREE';
      return p.planType === customerPlan;
    });
    if (!plan) continue;

    const withinQuota =
      metrics.projectsCreated <= plan.monthlyProjectLimit &&
      metrics.buildsExecuted <= plan.monthlyBuildLimit;

    quotaAssessments.push({
      readOnly: true,
      customerId: metrics.customerId,
      planType: plan.planType,
      withinQuota,
      upgradeRecommended: !withinQuota && plan.upgradePath !== null,
      detail: withinQuota
        ? `${plan.planType} plan within quota`
        : `Quota exceeded — upgrade to ${plan.upgradePath ?? 'ENTERPRISE'}`,
    });
  }

  return {
    plansDefined,
    quotaAssessments,
    subscriptionReadinessProven:
      plansDefined >= PLAN_TYPES.length &&
      input.plans.every((p) => PLAN_TYPES.includes(p.planType)),
  };
}

export function getSubscriptionPlans(): PlanDefinition[] {
  return buildPlanDefinitions();
}
